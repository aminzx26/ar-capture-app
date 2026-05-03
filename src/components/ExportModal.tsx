import { useState } from 'react'
import * as THREE from 'three'
import { exportGLB, exportGLTF, exportUSDZ, exportScreenshot } from '../utils/exportUtils'

interface Props {
  scene: THREE.Scene | null
  modelName: string
  screenshot: string | null
  onClose: () => void
  onCapture: () => string | null
}

type ExportFormat = 'glb' | 'gltf' | 'usdz' | 'png'

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: string; color: string }[] = [
  { id: 'glb', label: 'GLB', desc: 'Android AR / Universal 3D', icon: '🤖', color: '#00e676' },
  { id: 'usdz', label: 'USDZ', desc: 'iOS / iPadOS AR Quick Look', icon: '🍎', color: '#ff9500' },
  { id: 'gltf', label: 'GLTF', desc: 'JSON format with assets', icon: '📦', color: '#6c63ff' },
  { id: 'png', label: 'PNG', desc: 'Screenshot of current view', icon: '📸', color: '#ff6584' },
]

export default function ExportModal({ scene, modelName, screenshot, onClose, onCapture }: Props) {
  const [loading, setLoading] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (!scene && format !== 'png') {
      alert('No model loaded to export.')
      return
    }
    setLoading(format)
    try {
      const filename = modelName.replace(/\s+/g, '-').toLowerCase() || 'ar-model'
      if (format === 'glb') {
        await exportGLB(scene!, filename)
      } else if (format === 'gltf') {
        await exportGLTF(scene!, filename)
      } else if (format === 'usdz') {
        await exportUSDZ(scene!, filename)
      } else if (format === 'png') {
        const dataUrl = onCapture()
        if (dataUrl) exportScreenshot(null, filename)
      }
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. See console for details.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="overlay-panel" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Export AR File</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {screenshot && (
          <div style={{ marginBottom: '16px', borderRadius: '10px', overflow: 'hidden', aspectRatio: '16/9' }}>
            <img src={screenshot} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div className="export-format-grid">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              className="export-format-btn"
              onClick={() => handleExport(f.id)}
              disabled={loading !== null}
              style={{ opacity: loading && loading !== f.id ? 0.5 : 1 }}
            >
              {loading === f.id ? (
                <span className="spinner" />
              ) : (
                <span className="format-icon">{f.icon}</span>
              )}
              <span className="format-name" style={{ color: loading === f.id ? f.color : undefined }}>{f.label}</span>
              <span className="format-desc">{f.desc}</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(108,99,255,0.08)', borderRadius: '10px', border: '1px solid rgba(108,99,255,0.2)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>GLB / USDZ</strong> — Use in AR Quick Look (iOS) or Scene Viewer (Android). Scan the generated QR code to view in AR on mobile.
          </p>
        </div>
      </div>
    </div>
  )
}
