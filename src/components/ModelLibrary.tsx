import { useRef } from 'react'
import { BUILTIN_MODELS } from '../utils/builtinModels'
import { loadGLTFFromFile, loadOBJFromFile } from '../utils/modelUtils'
import * as THREE from 'three'

interface Props {
  selectedId: string | null
  onSelect: (id: string, object: THREE.Object3D) => void
  onUpload: (file: File, object: THREE.Object3D) => void
}

export default function ModelLibrary({ selectedId, onSelect, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (id: string) => {
    const model = BUILTIN_MODELS.find(m => m.id === id)
    if (!model) return
    const object = model.create()
    onSelect(id, object)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      let object: THREE.Object3D
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'glb' || ext === 'gltf') {
        object = await loadGLTFFromFile(file)
      } else if (ext === 'obj') {
        object = await loadOBJFromFile(file)
      } else {
        alert('Supported formats: .glb, .gltf, .obj')
        return
      }
      onUpload(file, object)
    } catch (err) {
      console.error('Failed to load model:', err)
      alert('Failed to load model. Please try a different file.')
    }
    e.target.value = ''
  }

  return (
    <div className="section-body">
      <div className="model-grid">
        {BUILTIN_MODELS.map((model) => (
          <button
            key={model.id}
            className={`model-card ${selectedId === model.id ? 'selected' : ''}`}
            onClick={() => handleSelect(model.id)}
            title={model.label}
          >
            <span className="model-card-icon">{model.emoji}</span>
            <span className="model-card-label">{model.label}</span>
          </button>
        ))}
      </div>
      <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
          <path d="M10 3v10M6 7l4-4 4 4M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Upload GLB / GLTF / OBJ
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.obj"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  )
}
