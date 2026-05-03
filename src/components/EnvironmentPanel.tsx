import type { EnvPreset } from './ARViewer'

const ENV_PRESETS: { id: EnvPreset; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'night', label: 'Night' },
  { id: 'neon', label: 'Neon' },
  { id: 'warm', label: 'Warm' },
]

const BG_COLORS = [
  { value: '#111118', label: 'Dark' },
  { value: '#050510', label: 'Black' },
  { value: '#0d1a2d', label: 'Navy' },
  { value: '#1a1200', label: 'Amber' },
  { value: '#0a000f', label: 'Purple' },
  { value: '#ffffff', label: 'White' },
]

interface Props {
  envPreset: EnvPreset
  bgColor: string
  onEnvChange: (preset: EnvPreset) => void
  onBgChange: (color: string) => void
}

export default function EnvironmentPanel({ envPreset, bgColor, onEnvChange, onBgChange }: Props) {
  return (
    <div className="section-body">
      <div className="color-row" style={{ marginBottom: '14px' }}>
        <label>Lighting</label>
        <div className="env-grid">
          {ENV_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`env-btn ${envPreset === p.id ? 'active' : ''}`}
              onClick={() => onEnvChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="color-row">
        <label>Background</label>
        <div className="color-swatches">
          {BG_COLORS.map((c) => (
            <button
              key={c.value}
              className={`color-swatch ${bgColor === c.value ? 'active' : ''}`}
              style={{
                background: c.value,
                border: c.value === '#ffffff' ? '2px solid #555' : undefined,
              }}
              title={c.label}
              onClick={() => onBgChange(c.value)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
