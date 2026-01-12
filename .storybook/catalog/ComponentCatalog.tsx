import { Link } from 'react-router-dom'
import {
  components,
  type DreiComponent,
  type Status,
  type RendererSupport,
  type Category,
  getTier,
} from '../demos/componentRegistry'

//* Component Catalog - Master Index ==============================
// Dashboard view that reads from the unified componentRegistry.
// This provides a visual overview of all components and their status.

//* Statistics Calculation ==============================

function calculateStats() {
  const total = components.length

  // Count by renderer support type
  const byRendererSupport = components.reduce(
    (acc, c) => {
      acc[c.rendererSupport] = (acc[c.rendererSupport] || 0) + 1
      return acc
    },
    {} as Record<RendererSupport, number>
  )

  const examplesComplete = components.filter((c) => c.component !== undefined).length
  const testsComplete = components.filter((c) => c.tests === '🟢').length
  const typesClean = components.filter((c) => c.types === '🟢').length

  // TSL conversion stats - only for dual renderer components that need WebGPU work
  const dualComponents = components.filter((c) => c.rendererSupport === 'dual')
  const tslConverted = dualComponents.filter((c) => c.tslConversion === '🟢').length
  const tslTotal = dualComponents.length

  // WebGPU ready stats
  const webgpuReady = components.filter(
    (c) => c.rendererSupport === 'universal' || c.rendererSupport === 'webgpu-only' || c.webgpuStatus === '🟢'
  ).length

  return {
    total,
    byRendererSupport,
    examplesComplete,
    testsComplete,
    typesClean,
    tslConverted,
    tslTotal,
    webgpuReady,
    universalCount: byRendererSupport.universal || 0,
    dualCount: byRendererSupport.dual || 0,
    legacyOnlyCount: byRendererSupport['legacy-only'] || 0,
  }
}

//* Group by Category ==============================

function groupComponents() {
  const grouped: Record<Category, DreiComponent[]> = {} as Record<Category, DreiComponent[]>

  components.forEach((c) => {
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

function ComponentRow({ entry }: { entry: DreiComponent }) {
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
      </td>

      {/* Renderer Support */}
      <td style={{ padding: '8px 12px' }}>
        <RendererBadge support={entry.rendererSupport} />
      </td>

      {/* Base status columns */}
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={entry.structure} label="Structure" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={entry.imports} label="Imports" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={entry.types} label="Types" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={hasExample ? '🟢' : '🔴'} label="Example" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={entry.tests} label="Tests" />
      </td>

      {/* Renderer-specific columns (for dual) */}
      <td style={{ padding: '8px 12px' }}>
        {isDual ? <StatusBadge status={entry.legacyStatus || '⚪'} label="Legacy" /> : '-'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isDual ? <StatusBadge status={entry.webgpuStatus || '⚪'} label="WebGPU" /> : '-'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {isDual ? <StatusBadge status={entry.tslConversion || '⚪'} label="TSL" /> : '-'}
      </td>

      {/* Notes and Path */}
      <td style={{ padding: '8px 12px', color: '#888', fontSize: '12px', maxWidth: '200px' }}>{entry.notes}</td>
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
      <p style={{ color: '#888', marginBottom: '32px' }}>
        Master index of all components. Click component names to view working examples.
      </p>

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
          label="Tests"
          value={`${stats.testsComplete}/${stats.total}`}
          percent={(stats.testsComplete / stats.total) * 100}
        />
        <StatCard
          label="Types Clean"
          value={`${stats.typesClean}/${stats.total}`}
          percent={(stats.typesClean / stats.total) * 100}
        />
        <StatCard
          label="WebGPU Ready"
          value={`${stats.webgpuReady}/${stats.total}`}
          percent={(stats.webgpuReady / stats.total) * 100}
        />
        <StatCard
          label="TSL Conversions"
          value={`${stats.tslConverted}/${stats.tslTotal}`}
          percent={stats.tslTotal > 0 ? (stats.tslConverted / stats.tslTotal) * 100 : 0}
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
                    <th style={{ padding: '8px 12px' }}>Structure</th>
                    <th style={{ padding: '8px 12px' }}>Imports</th>
                    <th style={{ padding: '8px 12px' }}>Types</th>
                    <th style={{ padding: '8px 12px' }}>Example</th>
                    <th style={{ padding: '8px 12px' }}>Tests</th>
                    <th style={{ padding: '8px 12px' }}>Legacy</th>
                    <th style={{ padding: '8px 12px' }}>WebGPU</th>
                    <th style={{ padding: '8px 12px' }}>TSL</th>
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
export { type DreiComponent, type Status, type RendererSupport, type Category, getTier }
