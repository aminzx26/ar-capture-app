import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  modelName: string
  onClose: () => void
}

// Generates a model-viewer demo URL that shows a sample AR experience
// In production this would be a URL to the hosted AR file
function buildARUrl(modelName: string): string {
  const encoded = encodeURIComponent(modelName)
  // Use Google's model-viewer demo with a sample model for demonstration
  // In production, replace with your hosted GLB/USDZ URL
  return `https://modelviewer.dev/shared-assets/models/Astronaut.glb?ar=true&model=${encoded}`
}

export default function QRModal({ modelName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const url = buildARUrl(modelName)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  }, [url])

  const copyUrl = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overlay-panel" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Share in AR</span>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="qr-wrap">
          <canvas ref={canvasRef} />
        </div>

        <p className="qr-url">{url}</p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="export-btn primary"
            style={{ flex: 1, maxWidth: 'none' }}
            onClick={copyUrl}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
              {copied
                ? <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                : <path d="M7 4H4a1 1 0 00-1 1v11a1 1 0 001 1h9a1 1 0 001-1v-3M9 4h7v7H9V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              }
            </svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button className="export-btn" style={{ flex: 1, maxWidth: 'none' }} onClick={onClose}>
            Done
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text2)', textAlign: 'center', marginTop: '12px', lineHeight: 1.6 }}>
          Scan with your phone camera to view in AR. Export the GLB/USDZ file and host it to generate a live AR link.
        </p>
      </div>
    </div>
  )
}
