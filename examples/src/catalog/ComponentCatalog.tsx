import { Link } from 'react-router-dom'
import { ComponentEntry, components, Status, Tier } from './comonentList'

//* Component Catalog - Master Index ==============================
// This file serves as the source of truth for all drei components
// and their example/test status. Use this as your working checklist.

//* Statistics Calculation ==============================

function calculateStats() {
  const total = components.length
  const byTier = components.reduce(
    (acc, c) => {
      acc[c.tier] = (acc[c.tier] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const examplesComplete = components.filter((c) => c.example === '🟢').length
  const testsComplete = components.filter((c) => c.tests === '🟢').length
  const typesClean = components.filter((c) => c.types === '🟢').length
  const tslConverted = components.filter((c) => c.tier === 'webgpu' && c.tslConversion === '🟢').length
  const tslTotal = components.filter((c) => c.tier === 'webgpu').length

  return { total, byTier, examplesComplete, testsComplete, typesClean, tslConverted, tslTotal }
}

//* Group by Tier and Category ==============================

function groupComponents() {
  const grouped: Record<string, Record<string, ComponentEntry[]>> = {}

  components.forEach((c) => {
    if (!grouped[c.tier]) grouped[c.tier] = {}
    if (!grouped[c.tier][c.category]) grouped[c.tier][c.category] = []
    grouped[c.tier][c.category].push(c)
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

//* Component Row ==============================

function ComponentRow({ entry }: { entry: ComponentEntry }) {
  const hasExample = entry.example === '🟢'

  return (
    <tr style={{ borderBottom: '1px solid #333' }}>
      <td style={{ padding: '8px 12px' }}>
        {hasExample ? (
          <Link to={entry.examplePath} style={{ color: '#4fc3f7', textDecoration: 'none' }}>
            {entry.name}
          </Link>
        ) : (
          <span style={{ color: '#888' }}>{entry.name}</span>
        )}
      </td>
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
        <StatusBadge status={entry.example} label="Example" />
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge status={entry.tests} label="Tests" />
      </td>
      {entry.tier === 'webgpu' && (
        <td style={{ padding: '8px 12px' }}>
          <StatusBadge status={entry.tslConversion || '⚪'} label="TSL" />
        </td>
      )}
      <td style={{ padding: '8px 12px', color: '#888', fontSize: '12px' }}>{entry.notes}</td>
      <td style={{ padding: '8px 12px' }}>
        <code style={{ fontSize: '11px', color: '#666', background: '#222', padding: '2px 6px', borderRadius: '3px' }}>
          {entry.examplePath}
        </code>
      </td>
    </tr>
  )
}

//* Main Catalog Component ==============================

export default function ComponentCatalog() {
  const stats = calculateStats()
  const grouped = groupComponents()
  const tierOrder: Tier[] = ['core', 'external', 'experimental', 'legacy', 'webgpu']

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', color: '#e0e0e0' }}>
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
          label="TSL Conversions"
          value={`${stats.tslConverted}/${stats.tslTotal}`}
          percent={(stats.tslConverted / stats.tslTotal) * 100}
        />
      </div>

      {/* Component Tables by Tier --------------------------------- */}
      {tierOrder.map((tier) => {
        if (!grouped[tier]) return null

        return (
          <div key={tier} style={{ marginBottom: '48px' }}>
            <h2
              style={{
                textTransform: 'uppercase',
                color: getTierColor(tier),
                borderBottom: `2px solid ${getTierColor(tier)}`,
                paddingBottom: '8px',
                marginBottom: '16px',
              }}
            >
              {tier} ({Object.values(grouped[tier]).flat().length} components)
            </h2>

            {Object.entries(grouped[tier]).map(([category, entries]) => (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#aaa', fontSize: '16px', marginBottom: '8px' }}>
                  {category} ({entries.length})
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ background: '#1a1a1a', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Component</th>
                        <th style={{ padding: '8px 12px' }}>Structure</th>
                        <th style={{ padding: '8px 12px' }}>Imports</th>
                        <th style={{ padding: '8px 12px' }}>Types</th>
                        <th style={{ padding: '8px 12px' }}>Example</th>
                        <th style={{ padding: '8px 12px' }}>Tests</th>
                        {tier === 'webgpu' && <th style={{ padding: '8px 12px' }}>TSL</th>}
                        <th style={{ padding: '8px 12px' }}>Notes</th>
                        <th style={{ padding: '8px 12px' }}>Example Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <ComponentRow key={`${entry.tier}-${entry.name}`} entry={entry} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {/* Legend --------------------------------- */}
      <div style={{ marginTop: '48px', padding: '16px', background: '#1a1a1a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '8px' }}>Legend</h3>
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
              width: `${percent}%`,
              height: '100%',
              background: percent > 80 ? '#4caf50' : percent > 50 ? '#ff9800' : '#f44336',
            }}
          />
        </div>
      )}
    </div>
  )
}

function getTierColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    core: '#4fc3f7',
    legacy: '#ff9800',
    webgpu: '#ab47bc',
    external: '#66bb6a',
    experimental: '#ef5350',
  }
  return colors[tier]
}

//* Workflow Instructions Section ==============================

function WorkflowSection() {
  return (
    <div
      style={{
        background: '#0d1b2a',
        border: '1px solid #1b3a4b',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '32px',
      }}
    >
      <h2 style={{ color: '#4fc3f7', marginBottom: '16px' }}>📋 Workflow: Example → Test</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Step 1 */}
        <div>
          <h3 style={{ color: '#81c784', marginBottom: '8px' }}>1. Create Example</h3>
          <pre
            style={{
              background: '#0a0a0a',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {`// examples/src/demos/core/geometry/RoundedBox.tsx
import { RoundedBox } from '@react-three/drei/core'
import Scene from '../../../components/Scene'

export default function RoundedBoxDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>RoundedBox</h2>
        <p>Description...</p>
      </div>
      <div className="demo-canvas">
        <Scene>
          <RoundedBox args={[1, 1, 1]} radius={0.1}>
            <meshStandardMaterial color="hotpink" />
          </RoundedBox>
        </Scene>
      </div>
    </div>
  )
}`}
          </pre>
        </div>

        {/* Step 2 */}
        <div>
          <h3 style={{ color: '#81c784', marginBottom: '8px' }}>2. Register in App.tsx</h3>
          <pre
            style={{
              background: '#0a0a0a',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {`// examples/src/App.tsx

// Add import at top
import RoundedBoxDemo from 
  './demos/core/geometry/RoundedBox'

// Add to demos array
const demos: Demo[] = [
  // ... existing demos
  { 
    path: '/core/geometry/roundedbox', 
    name: 'RoundedBox', 
    component: RoundedBoxDemo, 
    tier: 'core', 
    category: 'Geometry' 
  },
]`}
          </pre>
        </div>

        {/* Step 3 */}
        <div>
          <h3 style={{ color: '#81c784', marginBottom: '8px' }}>3. Copy to Test File</h3>
          <pre
            style={{
              background: '#0a0a0a',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {`// src/core/Geometry/RoundedBox/RoundedBox.test.tsx
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { RoundedBox } from './RoundedBox'

describe('RoundedBox', () => {
  it('renders without crashing', () => {
    render(
      <Canvas>
        <RoundedBox args={[1, 1, 1]} radius={0.1}>
          <meshStandardMaterial />
        </RoundedBox>
      </Canvas>
    )
  })
  
  it('accepts custom props', () => {
    // Add specific assertions...
  })
})`}
          </pre>
        </div>
      </div>

      {/* Quick Reference */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #1b3a4b', paddingTop: '16px' }}>
        <h3 style={{ color: '#ffb74d', marginBottom: '8px' }}>Quick Reference</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            fontSize: '13px',
          }}
        >
          <div>
            <strong>Run examples:</strong>
            <code
              style={{ display: 'block', background: '#0a0a0a', padding: '8px', marginTop: '4px', borderRadius: '4px' }}
            >
              cd examples && yarn dev
            </code>
          </div>
          <div>
            <strong>Run tests:</strong>
            <code
              style={{ display: 'block', background: '#0a0a0a', padding: '8px', marginTop: '4px', borderRadius: '4px' }}
            >
              yarn test
            </code>
          </div>
          <div>
            <strong>Update status:</strong>
            <code
              style={{ display: 'block', background: '#0a0a0a', padding: '8px', marginTop: '4px', borderRadius: '4px' }}
            >
              Edit ComponentCatalog.tsx
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

//* Export the components array for use in other files ==============================
export { components, type ComponentEntry, type Status, type Tier }
