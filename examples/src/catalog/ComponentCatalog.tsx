import { Link } from 'react-router-dom'
import {
  componentViews,
  statusOf,
  type ComponentView,
  type Status,
  type RendererSupport,
  type Category,
  getTier,
} from '../demos/componentRegistry'

//* Component Catalog - Master Index ==============================
// Every status shown here is DERIVED from the filesystem via
// component-status.generated.ts. Nothing on this page is hand-maintained.
//
// It used to be: `structure`, `imports`, `types`, `tests`, `webgpuStatus` and
// `tslConversion` were typed by hand in the registry, and by August 2026 the
// dashboard reported 19 components as having no WebGPU implementation when the
// files were on disk. Columns that cannot be derived were removed rather than
// guessed — a blank is better than a stale green.

const views = componentViews()

//* Statistics Calculation ==============================

function calculateStats() {
  const total = views.length

  const byRendererSupport = views.reduce(
    (acc, c) => {
      acc[c.rendererSupport] = (acc[c.rendererSupport] || 0) + 1
      return acc
    },
    {} as Record<RendererSupport, number>
  )

  const examplesComplete = views.filter((c) => c.component !== undefined).length
  const storiesComplete = views.filter((c) => c.story).length
  const testsComplete = views.filter((c) => c.test).length
  const docsComplete = views.filter((c) => c.docs).length

  // A WebGPU implementation EXISTS. Not a claim that it works — most of these
  // have never been rendered. See #2801.
  const dualComponents = views.filter((c) => c.rendererSupport === 'dual')
  const webgpuImplemented = dualComponents.filter((c) => c.webgpu).length
  const webgpuTotal = dualComponents.length

  // A story that renders the WEBGPU implementation — the only components anyone
  // has actually seen. `c.story` is true for a story in any tree, which is not
  // the same question and reports 20 instead of 2.
  const webgpuSeen = views.filter((c) => c.webgpuStory).length

  const unknown = views.filter((c) => !c.known).length

  return {
    total,
    byRendererSupport,
    examplesComplete,
    storiesComplete,
    testsComplete,
    docsComplete,
    webgpuImplemented,
    webgpuTotal,
    webgpuSeen,
    unknown,
    universalCount: byRendererSupport.universal || 0,
    dualCount: byRendererSupport.dual || 0,
    legacyOnlyCount: byRendererSupport['legacy-only'] || 0,
  }
}

//* Group by Category ==============================

function groupComponents() {
  const grouped: Record<Category, ComponentView[]> = {} as Record<Category, ComponentView[]>

  views.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = []
    grouped[c.category].push(c)
  })

  return grouped
}

//* Status Badge Component ==============================

function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const colors: Record<Status, string> = {
    '🟢': '#4caf50',
    '🟡': '#ff9800',
    '🔴': '#f44336',
    '⚪': '#9e9e9e',
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${colors[status]}22`,
        border: `1px solid ${colors[status]}`,
        fontSize: '12px',
        marginRight: '4px',
      }}
      title={label}
    >
      {status}
    </span>
  )
}

//* Renderer Support Badge ==============================

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
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        backgroundColor: `${color}22`,
        border: `1px solid ${color}`,
        fontSize: '11px',
        color: color,
      }}
    >
      {label}
    </span>
  )
}

//* Component Row ==============================

function ComponentRow({ entry }: { entry: ComponentView }) {
  const hasExample = entry.component !== undefined
  const isDual = entry.rendererSupport === 'dual'

  return (
    <tr style={{ borderBottom: '1px solid #333' }}>
      {/* Name with example link */}
      <td style={{ padding: '8px 12px' }}>
        {hasExample ? (
          <Link to={entry.path} style={{ color: '#4fc3f7', textDecoration: 'none' }}>
            {entry.name}
          </Link>
        ) : (
          <span style={{ color: '#888' }}>{entry.name}</span>
        )}
        {!entry.known && (
          <span title="No audit record — registry and filesystem disagree" style={{ color: '#f44336' }}>
            {' '}
            ⚠
          </span>
        )}
      </td>

      {/* Renderer Support */}
      <td style={{ padding: '8px 12px' }}>
        <RendererBadge support={entry.rendererSupport} />
      </td>

      {/* Coverage — all derived from the filesystem */}
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={statusOf(hasExample)} label="Example" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={statusOf(entry.story)} label="Story" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={statusOf(entry.test)} label="Test" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={statusOf(entry.docs)} label="Docs" />
      </td>

      {/* Which renderer trees the component exists in */}
      <td style={{ padding: '8px 12px' }}>
        {isDual ? <StatusBadge status={statusOf(entry.legacy)} label="Legacy" /> : '-'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isDual ? <StatusBadge status={statusOf(entry.webgpu)} label="WebGPU implementation exists" /> : '-'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {entry.webgpu ? <StatusBadge status={statusOf(entry.webgpuStory)} label="Story renders WebGPU" /> : '-'}
      </td>

      {/* Notes and Path */}
      <td style={{ padding: '8px 12px', color: '#888', fontSize: '12px', maxWidth: '200px' }}>
        {entry.reason ?? entry.notes}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <code style={{ fontSize: '11px', color: '#666', background: '#222', padding: '2px 6px', borderRadius: '3px' }}>
          {entry.path}
        </code>
      </td>
    </tr>
  )
}

//* Main Catalog Component ==============================

export default function ComponentCatalog() {
  const stats = calculateStats()
  const grouped = groupComponents()
  const categoryOrder: Category[] = [
    'Cameras',
    'Controls',
    'Abstractions',
    'Effects',
    'Geometry',
    'Helpers',
    'Loaders',
    'Performance',
    'Portal',
    'Staging',
    'UI',
    'Materials',
    'External',
    'Experimental',
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', color: '#e0e0e0' }}>
      {/* Header --------------------------------- */}
      <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#fff' }}>Drei v11 Component Catalog</h1>
      <p style={{ color: '#888', marginBottom: stats.unknown > 0 ? '12px' : '32px' }}>
        Master index of all components. Click component names to view working examples. Every status column is derived
        from the filesystem by <code>yarn audit:components</code> — nothing here is hand-maintained.
      </p>

      {stats.unknown > 0 && (
        <div
          style={{
            marginBottom: '32px',
            padding: '12px 16px',
            borderRadius: '4px',
            border: '1px solid #f44336',
            backgroundColor: '#f4433622',
            color: '#f44336',
            fontSize: '14px',
          }}
        >
          <strong>{stats.unknown}</strong> {stats.unknown === 1 ? 'entry has' : 'entries have'} no audit record — the
          registry names a component the filesystem does not have. Marked ⚠ below. Run{' '}
          <code>yarn audit:components</code> and reconcile the names.
        </div>
      )}

      {/* Stats Overview --------------------------------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <StatCard label="Total Components" value={stats.total} />
        <StatCard
          label="Examples"
          value={`${stats.examplesComplete}/${stats.total}`}
          percent={(stats.examplesComplete / stats.total) * 100}
        />
        <StatCard
          label="Stories"
          value={`${stats.storiesComplete}/${stats.total}`}
          percent={(stats.storiesComplete / stats.total) * 100}
        />
        <StatCard
          label="Tests"
          value={`${stats.testsComplete}/${stats.total}`}
          percent={(stats.testsComplete / stats.total) * 100}
        />
        <StatCard
          label="Docs"
          value={`${stats.docsComplete}/${stats.total}`}
          percent={(stats.docsComplete / stats.total) * 100}
        />
        <StatCard
          label="WebGPU implemented"
          value={`${stats.webgpuImplemented}/${stats.webgpuTotal}`}
          percent={stats.webgpuTotal > 0 ? (stats.webgpuImplemented / stats.webgpuTotal) * 100 : 0}
        />
        <StatCard
          label="WebGPU with a story"
          value={`${stats.webgpuSeen}/${stats.webgpuImplemented}`}
          percent={stats.webgpuImplemented > 0 ? (stats.webgpuSeen / stats.webgpuImplemented) * 100 : 0}
        />
      </div>

      {/* Renderer Support Summary --------------------------------- */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ background: '#1a1a1a', padding: '12px 20px', borderRadius: '8px', border: '1px solid #333' }}>
          <span style={{ color: '#4fc3f7' }}>●</span> Universal: <strong>{stats.universalCount}</strong>
        </div>
        <div style={{ background: '#1a1a1a', padding: '12px 20px', borderRadius: '8px', border: '1px solid #333' }}>
          <span style={{ color: '#66bb6a' }}>●</span> Dual Renderer: <strong>{stats.dualCount}</strong>
        </div>
        <div style={{ background: '#1a1a1a', padding: '12px 20px', borderRadius: '8px', border: '1px solid #333' }}>
          <span style={{ color: '#ff9800' }}>●</span> Legacy Only: <strong>{stats.legacyOnlyCount}</strong>
        </div>
      </div>

      {/* Component Tables by Category --------------------------------- */}
      {categoryOrder.map((category) => {
        const entries = grouped[category]
        if (!entries || entries.length === 0) return null

        return (
          <div key={category} style={{ marginBottom: '48px' }}>
            <h2
              style={{
                color: getCategoryColor(category),
                borderBottom: `2px solid ${getCategoryColor(category)}`,
                paddingBottom: '8px',
                marginBottom: '16px',
              }}
            >
              {category} ({entries.length} components)
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#1a1a1a', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', minWidth: '150px' }}>Component</th>
                    <th style={{ padding: '8px 12px', minWidth: '100px' }}>Renderer</th>
                    <th style={{ padding: '8px 12px' }}>Example</th>
                    <th style={{ padding: '8px 12px' }}>Story</th>
                    <th style={{ padding: '8px 12px' }}>Test</th>
                    <th style={{ padding: '8px 12px' }}>Docs</th>
                    <th style={{ padding: '8px 12px' }}>Legacy</th>
                    <th style={{ padding: '8px 12px' }} title="A src/webgpu/ file exists — not a claim that it works">
                      WebGPU
                    </th>
                    <th style={{ padding: '8px 12px' }} title="A story that renders the WebGPU implementation">
                      WebGPU story
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '150px' }}>Notes</th>
                    <th style={{ padding: '8px 12px' }}>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <ComponentRow key={`${entry.name}-${idx}`} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Legend --------------------------------- */}
      <div style={{ marginTop: '48px', padding: '16px', background: '#1a1a1a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '12px' }}>Legend</h3>

        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Status</h4>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span>
              <StatusBadge status="🟢" /> Complete & Verified
            </span>
            <span>
              <StatusBadge status="🟡" /> Needs Work
            </span>
            <span>
              <StatusBadge status="🔴" /> Not Started
            </span>
            <span>
              <StatusBadge status="⚪" /> N/A
            </span>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Renderer Support</h4>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <span>
              <RendererBadge support="universal" /> Works with any renderer (no shader code)
            </span>
            <span>
              <RendererBadge support="dual" /> Has both legacy and WebGPU implementations
            </span>
            <span>
              <RendererBadge support="legacy-only" /> Only WebGL/legacy implementation exists
            </span>
            <span>
              <RendererBadge support="webgpu-only" /> Only WebGPU/TSL implementation exists
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

//* Helper Components ==============================

function StatCard({ label, value, percent }: { label: string; value: string | number; percent?: number }) {
  return (
    <div
      style={{
        background: '#1a1a1a',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #333',
      }}
    >
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#888' }}>{label}</div>
      {percent !== undefined && (
        <div
          style={{
            marginTop: '8px',
            height: '4px',
            background: '#333',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, percent)}%`,
              height: '100%',
              background: percent > 80 ? '#4caf50' : percent > 50 ? '#ff9800' : '#f44336',
            }}
          />
        </div>
      )}
    </div>
  )
}

function getCategoryColor(category: Category): string {
  const colors: Record<Category, string> = {
    Cameras: '#4fc3f7',
    Controls: '#4fc3f7',
    Abstractions: '#4fc3f7',
    Effects: '#4fc3f7',
    Geometry: '#4fc3f7',
    Helpers: '#4fc3f7',
    Loaders: '#4fc3f7',
    Performance: '#4fc3f7',
    Portal: '#4fc3f7',
    Staging: '#4fc3f7',
    UI: '#4fc3f7',
    Materials: '#ab47bc', // Materials stand out as they need shader work
    External: '#66bb6a',
    Experimental: '#ef5350',
  }
  return colors[category]
}

//* Re-export types for convenience ==============================
export { type ComponentView, type Status, type RendererSupport, type Category, getTier }
