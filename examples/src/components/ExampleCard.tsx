import { getComponent, statusOf, type Status, type RendererSupport } from '../demos/componentRegistry'

//* Status Badge Component ==============================

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const colors: Record<Status, string> = {
    '🟢': '#4caf50',
    '🟡': '#ff9800',
    '🔴': '#f44336',
    '⚪': '#9e9e9e',
  }

  const labels: Record<Status, string> = {
    '🟢': 'Complete',
    '🟡': 'In Progress',
    '🔴': 'Not Started',
    '⚪': 'N/A',
  }

  return (
    <span
      className="status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${colors[status]}22`,
        border: `1px solid ${colors[status]}`,
        fontSize: '11px',
        color: colors[status],
      }}
      title={`${label}: ${labels[status]}`}
    >
      {status} {label}
    </span>
  )
}

//* Renderer Badge Component ==============================

function RendererBadge({ support }: { support: RendererSupport }) {
  const config: Record<RendererSupport, { color: string; label: string }> = {
    universal: { color: '#4fc3f7', label: 'Universal' },
    'legacy-only': { color: '#ff9800', label: 'Legacy Only' },
    'webgpu-only': { color: '#ab47bc', label: 'WebGPU Only' },
    dual: { color: '#66bb6a', label: 'Dual' },
    unknown: { color: '#9e9e9e', label: 'Unknown' },
  }

  const { color, label } = config[support]

  return (
    <span
      style={{
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '3px',
        backgroundColor: `${color}22`,
        color: color,
        border: `1px solid ${color}`,
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  )
}

//* Example Card Component ==============================

export const ExampleCard = ({ demoName, showStatus = false }: { demoName: string; showStatus?: boolean }) => {
  const component = getComponent(demoName)
  const isDual = component.rendererSupport === 'dual'

  return (
    <div className="demo-info">
      <div className="demo-header">
        <h2>{component.title}</h2>
        <RendererBadge support={component.rendererSupport} />
      </div>

      <p className="demo-description">{component.description}</p>

      {showStatus && (
        <>
          {/* Coverage — every one of these is derived from the filesystem */}
          <div className="demo-status" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
            <StatusBadge status={statusOf(component.story)} label="Story" />
            <StatusBadge status={statusOf(component.test)} label="Test" />
            <StatusBadge status={statusOf(component.docs)} label="Docs" />
          </div>

          {/* Which renderer trees the component actually exists in */}
          {isDual && (
            <div className="demo-status" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <StatusBadge status={statusOf(component.legacy)} label="Legacy" />
              <StatusBadge status={statusOf(component.webgpu)} label="WebGPU" />
            </div>
          )}

          {!component.known && (
            <p style={{ fontSize: '12px', color: '#f44336', marginTop: '8px' }}>
              No audit record for “{component.name}” — the registry and the filesystem disagree.
            </p>
          )}

          {component.reason && (
            <p style={{ fontSize: '12px', color: '#ff9800', marginTop: '8px' }}>Not ported: {component.reason}</p>
          )}
        </>
      )}

      {component.notes && showStatus && (
        <p className="demo-notes" style={{ fontSize: '12px', color: '#888', marginTop: '8px', fontStyle: 'italic' }}>
          Note: {component.notes}
        </p>
      )}
    </div>
  )
}

export default ExampleCard
