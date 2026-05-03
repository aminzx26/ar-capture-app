interface Props {
  scale: number
  rotationY: number
  elevation: number
  onChange: (key: 'scale' | 'rotationY' | 'elevation', value: number) => void
}

export default function TransformControls({ scale, rotationY, elevation, onChange }: Props) {
  return (
    <div className="section-body">
      <div className="transform-row">
        <div className="transform-label">
          <span className="transform-name">Scale</span>
          <span className="transform-value">{scale.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.01}
          value={scale}
          onChange={(e) => onChange('scale', parseFloat(e.target.value))}
          style={{ background: `linear-gradient(to right, #6c63ff ${((scale - 0.1) / 4.9) * 100}%, var(--surface) 0%)` }}
        />
      </div>

      <div className="transform-row">
        <div className="transform-label">
          <span className="transform-name">Rotate Y</span>
          <span className="transform-value">{Math.round(rotationY)}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotationY}
          onChange={(e) => onChange('rotationY', parseFloat(e.target.value))}
          style={{ background: `linear-gradient(to right, #ff6584 ${(rotationY / 360) * 100}%, var(--surface) 0%)` }}
        />
      </div>

      <div className="transform-row">
        <div className="transform-label">
          <span className="transform-name">Elevation</span>
          <span className="transform-value">{elevation.toFixed(2)}m</span>
        </div>
        <input
          type="range"
          min={-2}
          max={3}
          step={0.01}
          value={elevation}
          onChange={(e) => onChange('elevation', parseFloat(e.target.value))}
          style={{ background: `linear-gradient(to right, #00e676 ${((elevation + 2) / 5) * 100}%, var(--surface) 0%)` }}
        />
      </div>
    </div>
  )
}
