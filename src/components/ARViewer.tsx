import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { centerAndNormalize } from '../utils/modelUtils'

export interface ARViewerHandle {
  getScene: () => THREE.Scene | null
  getRenderer: () => THREE.WebGLRenderer | null
  captureScreenshot: () => string | null
  loadModel: (object: THREE.Object3D) => void
  clearModel: () => void
  setScale: (s: number) => void
  setRotationY: (deg: number) => void
  setElevation: (y: number) => void
  setEnvPreset: (preset: EnvPreset) => void
  setBgColor: (color: string) => void
}

export type EnvPreset = 'studio' | 'outdoor' | 'night' | 'neon' | 'warm'

interface Props {
  hasModel: boolean
}

const ENV_CONFIGS: Record<EnvPreset, { bg: string; ambientColor: number; ambientIntensity: number; dirColor: number; dirIntensity: number }> = {
  studio: { bg: '#111118', ambientColor: 0xffffff, ambientIntensity: 1.5, dirColor: 0xffffff, dirIntensity: 2 },
  outdoor: { bg: '#0d1a2d', ambientColor: 0x88aaff, ambientIntensity: 1.2, dirColor: 0xffeedd, dirIntensity: 2.5 },
  night: { bg: '#050510', ambientColor: 0x2233aa, ambientIntensity: 0.5, dirColor: 0x4488ff, dirIntensity: 0.8 },
  neon: { bg: '#0a000f', ambientColor: 0xff00ff, ambientIntensity: 1.0, dirColor: 0x00ffff, dirIntensity: 1.5 },
  warm: { bg: '#1a0f00', ambientColor: 0xffaa44, ambientIntensity: 1.2, dirColor: 0xff8800, dirIntensity: 2.2 },
}

const ARViewer = forwardRef<ARViewerHandle, Props>(({ hasModel }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const lightsRef = useRef<{ ambient: THREE.AmbientLight; dir: THREE.DirectionalLight; fill: THREE.DirectionalLight } | null>(null)
  const frameRef = useRef<number>(0)
  const envRef = useRef<EnvPreset>('studio')

  const initScene = useCallback(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#111118')
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.01, 1000)
    camera.position.set(0, 1.5, 4)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.5
    controls.maxDistance = 20
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    const dir = new THREE.DirectionalLight(0xffffff, 2)
    dir.position.set(3, 5, 4)
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    const fill = new THREE.DirectionalLight(0x8888ff, 0.5)
    fill.position.set(-3, 1, -2)
    scene.add(ambient, dir, fill)
    lightsRef.current = { ambient, dir, fill }

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x333355, 0x222233)
    grid.name = '__grid__'
    scene.add(grid)

    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const cleanup = initScene()
    return () => {
      cleanup?.()
      cancelAnimationFrame(frameRef.current)
      rendererRef.current?.dispose()
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [initScene])

  useImperativeHandle(ref, () => ({
    getScene: () => sceneRef.current,
    getRenderer: () => rendererRef.current,

    captureScreenshot: () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null
      rendererRef.current.render(sceneRef.current, cameraRef.current)
      return rendererRef.current.domElement.toDataURL('image/png')
    },

    loadModel: (object: THREE.Object3D) => {
      const group = modelGroupRef.current
      if (!group) return
      while (group.children.length) group.remove(group.children[0])
      centerAndNormalize(object)
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      group.add(object)
      group.rotation.set(0, 0, 0)
      group.scale.setScalar(1)
      group.position.set(0, 0, 0)
    },

    clearModel: () => {
      const group = modelGroupRef.current
      if (!group) return
      while (group.children.length) group.remove(group.children[0])
    },

    setScale: (s: number) => {
      if (modelGroupRef.current) modelGroupRef.current.scale.setScalar(s)
    },

    setRotationY: (deg: number) => {
      if (modelGroupRef.current) modelGroupRef.current.rotation.y = (deg * Math.PI) / 180
    },

    setElevation: (y: number) => {
      if (modelGroupRef.current) modelGroupRef.current.position.y = y
    },

    setEnvPreset: (preset: EnvPreset) => {
      envRef.current = preset
      const cfg = ENV_CONFIGS[preset]
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(cfg.bg)
      if (lightsRef.current) {
        lightsRef.current.ambient.color.setHex(cfg.ambientColor)
        lightsRef.current.ambient.intensity = cfg.ambientIntensity
        lightsRef.current.dir.color.setHex(cfg.dirColor)
        lightsRef.current.dir.intensity = cfg.dirIntensity
      }
    },

    setBgColor: (color: string) => {
      if (sceneRef.current) sceneRef.current.background = new THREE.Color(color)
    },
  }))

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {!hasModel && (
        <div className="viewer-empty">
          <svg className="viewer-empty-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 8L56 22V42L32 56L8 42V22L32 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
            <path d="M32 8V56M8 22L32 34L56 22" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h2>No Model Loaded</h2>
          <p>Choose a built-in shape or upload your own 3D model to get started</p>
        </div>
      )}
    </div>
  )
})

ARViewer.displayName = 'ARViewer'
export default ARViewer
