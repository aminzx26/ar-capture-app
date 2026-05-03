import { useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import ARViewer, { type ARViewerHandle, type EnvPreset } from './components/ARViewer'
import ModelLibrary from './components/ModelLibrary'
import TransformControls from './components/TransformControls'
import EnvironmentPanel from './components/EnvironmentPanel'
import ExportModal from './components/ExportModal'
import QRModal from './components/QRModal'
import { dataURLtoBlob } from './utils/exportUtils'
import { saveAs } from 'file-saver'

type ActiveTab = 'viewer' | 'export'

interface SectionState {
  models: boolean
  transform: boolean
  environment: boolean
}

export default function App() {
  const viewerRef = useRef<ARViewerHandle>(null)

  const [activeTab, setActiveTab] = useState<ActiveTab>('viewer')
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [modelName, setModelName] = useState('ar-model')
  const [hasModel, setHasModel] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotationY, setRotationY] = useState(0)
  const [elevation, setElevation] = useState(0)
  const [envPreset, setEnvPreset] = useState<EnvPreset>('studio')
  const [bgColor, setBgColor] = useState('#111118')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [showFlash, setShowFlash] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionState>({ models: true, transform: true, environment: false })

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  const handleModelSelect = (id: string, object: THREE.Object3D) => {
    viewerRef.current?.loadModel(object)
    setSelectedModelId(id)
    setHasModel(true)
    setModelName(id)
    setScale(1)
    setRotationY(0)
    setElevation(0)
    viewerRef.current?.setScale(1)
    viewerRef.current?.setRotationY(0)
    viewerRef.current?.setElevation(0)
    showToast(`Loaded ${id}`)
  }

  const handleUpload = (file: File, object: THREE.Object3D) => {
    viewerRef.current?.loadModel(object)
    setSelectedModelId('__uploaded__')
    setHasModel(true)
    setModelName(file.name.replace(/\.[^.]+$/, ''))
    setScale(1)
    setRotationY(0)
    setElevation(0)
    viewerRef.current?.setScale(1)
    viewerRef.current?.setRotationY(0)
    viewerRef.current?.setElevation(0)
    showToast(`Loaded ${file.name}`)
  }

  const handleTransformChange = (key: 'scale' | 'rotationY' | 'elevation', value: number) => {
    if (key === 'scale') {
      setScale(value)
      viewerRef.current?.setScale(value)
    } else if (key === 'rotationY') {
      setRotationY(value)
      viewerRef.current?.setRotationY(value)
    } else {
      setElevation(value)
      viewerRef.current?.setElevation(value)
    }
  }

  const handleEnvChange = (preset: EnvPreset) => {
    setEnvPreset(preset)
    viewerRef.current?.setEnvPreset(preset)
  }

  const handleBgChange = (color: string) => {
    setBgColor(color)
    viewerRef.current?.setBgColor(color)
  }

  const handleCapture = useCallback(() => {
    const dataUrl = viewerRef.current?.captureScreenshot()
    if (!dataUrl) return null
    setScreenshot(dataUrl)
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 500)
    showToast('Screenshot captured')
    return dataUrl
  }, [showToast])

  const handleSaveScreenshot = () => {
    const dataUrl = viewerRef.current?.captureScreenshot()
    if (!dataUrl) return
    setScreenshot(dataUrl)
    const blob = dataURLtoBlob(dataUrl)
    saveAs(blob, `${modelName}-capture.png`)
    showToast('Screenshot saved')
  }

  const toggleSection = (key: keyof SectionState) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getScene = () => {
    const scene = viewerRef.current?.getScene()
    return scene ?? null
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" fill="url(#lg1)" stroke="none"/>
            <path d="M14 3v22M3 9l11 6 11-6" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <defs>
              <linearGradient id="lg1" x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6c63ff"/>
                <stop offset="1" stopColor="#ff6584"/>
              </linearGradient>
            </defs>
          </svg>
          <span><span className="logo-badge">AR</span> Capture</span>
        </div>
        <div className="header-tabs">
          <button
            className={`tab-btn ${activeTab === 'viewer' ? 'active' : ''}`}
            onClick={() => setActiveTab('viewer')}
          >
            3D View
          </button>
          <button
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('export')
              if (hasModel) setShowExport(true)
            }}
          >
            Export
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="main">
        {/* AR Viewer */}
        <div className="viewer-panel">
          <ARViewer ref={viewerRef} hasModel={hasModel} />

          {/* AR Badge */}
          {hasModel && (
            <div className="ar-badge">
              <span className="ar-badge-dot" />
              AR READY
            </div>
          )}

          {/* Overlay action buttons */}
          <div className="viewer-overlay-btns">
            <button
              className="viewer-overlay-btn"
              title="Share QR Code"
              onClick={() => setShowQR(true)}
            >
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <rect x="13" y="13" width="2" height="2" fill="currentColor"/>
                <rect x="16" y="13" width="2" height="2" fill="currentColor"/>
                <rect x="13" y="16" width="2" height="2" fill="currentColor"/>
                <rect x="16" y="16" width="2" height="2" fill="currentColor"/>
              </svg>
            </button>
            <button
              className="viewer-overlay-btn"
              title="Export"
              onClick={() => setShowExport(true)}
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M10 3v10M6 9l4 4 4-4M4 15h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="viewer-overlay-btn"
              title="Reset view"
              onClick={() => {
                handleTransformChange('scale', 1)
                handleTransformChange('rotationY', 0)
                handleTransformChange('elevation', 0)
              }}
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 10a6 6 0 1112 0 6 6 0 01-12 0zM10 7v3l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Screenshot thumbnail */}
          {screenshot && (
            <div
              className="screenshot-preview"
              title="Click to save screenshot"
              onClick={handleSaveScreenshot}
            >
              <img src={screenshot} alt="capture" />
            </div>
          )}

          {/* File info */}
          {hasModel && (
            <div className="file-info">
              <strong>{modelName}</strong>
              Scale {scale.toFixed(2)}× · Rot {Math.round(rotationY)}°
            </div>
          )}

          {/* Flash */}
          {showFlash && <div className="capture-flash" />}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-scroll">

            {/* Models Section */}
            <div className="section">
              <div className="section-header" onClick={() => toggleSection('models')}>
                <span className="section-title">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M10 2v16M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  3D Models
                </span>
                <svg className={`section-chevron ${sections.models ? 'open' : ''}`} viewBox="0 0 20 20" fill="none">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {sections.models && (
                <ModelLibrary
                  selectedId={selectedModelId}
                  onSelect={handleModelSelect}
                  onUpload={handleUpload}
                />
              )}
            </div>

            {/* Transform Section */}
            <div className="section">
              <div className="section-header" onClick={() => toggleSection('transform')}>
                <span className="section-title">
                  <svg viewBox="0 0 20 20" fill="none">
                    <path d="M3 10h14M10 3v14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  </svg>
                  Transform
                </span>
                <svg className={`section-chevron ${sections.transform ? 'open' : ''}`} viewBox="0 0 20 20" fill="none">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {sections.transform && (
                <TransformControls
                  scale={scale}
                  rotationY={rotationY}
                  elevation={elevation}
                  onChange={handleTransformChange}
                />
              )}
            </div>

            {/* Environment Section */}
            <div className="section">
              <div className="section-header" onClick={() => toggleSection('environment')}>
                <span className="section-title">
                  <svg viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  Environment
                </span>
                <svg className={`section-chevron ${sections.environment ? 'open' : ''}`} viewBox="0 0 20 20" fill="none">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {sections.environment && (
                <EnvironmentPanel
                  envPreset={envPreset}
                  bgColor={bgColor}
                  onEnvChange={handleEnvChange}
                  onBgChange={handleBgChange}
                />
              )}
            </div>

          </div>

          {/* Capture / Export Bar */}
          <div className="capture-bar">
            <button
              className="export-btn"
              onClick={() => setShowQR(true)}
              title="Share via QR code"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <rect x="13" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <rect x="2" y="13" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13h2v2h-2zM15 15h2v2h-2z" fill="currentColor"/>
              </svg>
              QR Code
            </button>

            <button className="capture-btn" onClick={handleCapture} title="Capture screenshot">
              <svg viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
                <path d="M10 5H7a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3l-2-2h-4l-2 2z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>

            <button
              className="export-btn primary"
              onClick={() => setShowExport(true)}
              title="Export AR file"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M10 13V3M6 9l4 4 4-4M4 15h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export
            </button>
          </div>
        </aside>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}

      {/* Modals */}
      {showExport && (
        <ExportModal
          scene={getScene()}
          modelName={modelName}
          screenshot={screenshot}
          onClose={() => { setShowExport(false); setActiveTab('viewer') }}
          onCapture={handleCapture}
        />
      )}

      {showQR && (
        <QRModal
          modelName={modelName}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  )
}
