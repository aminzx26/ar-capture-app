import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'
import { saveAs } from 'file-saver'

export async function exportGLB(scene: THREE.Object3D, filename = 'ar-model'): Promise<void> {
  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
        saveAs(blob, `${filename}.glb`)
        resolve()
      },
      (error) => reject(error),
      { binary: true },
    )
  })
}

export async function exportGLTF(scene: THREE.Object3D, filename = 'ar-model'): Promise<void> {
  const exporter = new GLTFExporter()
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        const json = JSON.stringify(result, null, 2)
        const blob = new Blob([json], { type: 'model/gltf+json' })
        saveAs(blob, `${filename}.gltf`)
        resolve()
      },
      (error) => reject(error),
      { binary: false },
    )
  })
}

export async function exportUSDZ(scene: THREE.Object3D, filename = 'ar-model'): Promise<void> {
  const exporter = new USDZExporter()
  const arraybuffer = await (exporter as unknown as { parse: (scene: THREE.Object3D) => Promise<ArrayBuffer> }).parse(scene)
  const blob = new Blob([arraybuffer], { type: 'model/vnd.usdz+zip' })
  saveAs(blob, `${filename}.usdz`)
}

export function exportScreenshot(canvas: HTMLCanvasElement | null, filename = 'ar-capture'): string | null {
  if (!canvas) return null
  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `${filename}.png`
  link.click()
  return dataUrl
}

export function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new Blob([u8arr], { type: mime })
}
