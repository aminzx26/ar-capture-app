import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

export interface ModelInfo {
  name: string
  polyCount: number
  size: string
}

export function getModelInfo(scene: THREE.Object3D): ModelInfo {
  let polyCount = 0
  scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const geo = (obj as THREE.Mesh).geometry
      if (geo.index) polyCount += geo.index.count / 3
      else polyCount += geo.attributes.position.count / 3
    }
  })

  const bbox = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  bbox.getSize(size)

  return {
    name: scene.name || 'Model',
    polyCount: Math.round(polyCount),
    size: `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}m`,
  }
}

export async function loadGLTFFromFile(file: File): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader()
    const url = URL.createObjectURL(file)
    loader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url)
        resolve(gltf.scene)
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(url)
        reject(error)
      },
    )
  })
}

export async function loadOBJFromFile(file: File): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader()
    const url = URL.createObjectURL(file)
    loader.load(
      url,
      (obj) => {
        URL.revokeObjectURL(url)
        resolve(obj)
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(url)
        reject(error)
      },
    )
  })
}

export function centerAndNormalize(object: THREE.Object3D, targetSize = 2): void {
  const bbox = new THREE.Box3().setFromObject(object)
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  bbox.getCenter(center)
  bbox.getSize(size)

  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = targetSize / maxDim

  object.position.sub(center)
  object.scale.setScalar(scale)
}

export function getObjectURL(file: File): string {
  return URL.createObjectURL(file)
}
