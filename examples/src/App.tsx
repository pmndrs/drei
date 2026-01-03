import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'

//* Component Catalog (Master Index) ==============================
import ComponentCatalog from './catalog/ComponentCatalog'

//* Demo Imports ==============================

// Core - Cameras
import OrthographicCameraDemo from './demos/core/cameras/OrthographicCamera'
import PerspectiveCameraDemo from './demos/core/cameras/PerspectiveCamera'

// Core - Controls
import OrbitControlsDemo from './demos/core/controls/OrbitControls'

// Add more imports as you create demos...

//* Component Registry ==============================

interface Demo {
  path: string
  name: string
  component: React.ComponentType
  tier: 'core' | 'legacy' | 'webgpu' | 'external' | 'experimental'
  category: string
}

const demos: Demo[] = [
  // Core - Cameras
  {
    path: '/core/cameras/orthographic',
    name: 'OrthographicCamera',
    component: OrthographicCameraDemo,
    tier: 'core',
    category: 'Cameras',
  },
  {
    path: '/core/cameras/perspective',
    name: 'PerspectiveCamera',
    component: PerspectiveCameraDemo,
    tier: 'core',
    category: 'Cameras',
  },

  // Core - Controls
  {
    path: '/core/controls/orbit',
    name: 'OrbitControls',
    component: OrbitControlsDemo,
    tier: 'core',
    category: 'Controls',
  },

  // Add more demos here as you create them...
]

//* Organize Demos by Tier/Category ==============================

const demosByTier = demos.reduce(
  (acc, demo) => {
    if (!acc[demo.tier]) acc[demo.tier] = {}
    if (!acc[demo.tier][demo.category]) acc[demo.tier][demo.category] = []
    acc[demo.tier][demo.category].push(demo)
    return acc
  },
  {} as Record<string, Record<string, Demo[]>>
)

//* Layout Components ==============================

function Sidebar() {
  const location = useLocation()

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Drei v11</h1>
        <p>Component Examples</p>
      </div>

      <nav className="sidebar-nav">
        {/* Catalog Link */}
        <Link
          to="/catalog"
          className={`catalog-link ${location.pathname === '/catalog' ? 'active' : ''}`}
          style={{
            display: 'block',
            padding: '12px 16px',
            marginBottom: '16px',
            background: location.pathname === '/catalog' ? '#1b3a4b' : '#0d1b2a',
            borderRadius: '8px',
            color: '#4fc3f7',
            textDecoration: 'none',
            fontWeight: 'bold',
            border: '1px solid #1b3a4b',
          }}
        >
          📋 Component Catalog
        </Link>
        {Object.entries(demosByTier).map(([tier, categories]) => (
          <div key={tier} className="tier-section">
            <div className="tier-title">{tier.toUpperCase()}</div>
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="category-section">
                <div className="category-title">{category}</div>
                {items.map((demo) => (
                  <Link
                    key={demo.path}
                    to={demo.path}
                    className={`demo-link ${location.pathname === demo.path ? 'active' : ''}`}
                  >
                    {demo.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </div>
  )
}

function Home() {
  return (
    <div className="home">
      <h1>Drei v11 Examples</h1>
      <p>Select a component from the sidebar to see it in action.</p>
      <div className="stats">
        <div className="stat">
          <strong>{demos.length}</strong>
          <span>Working Examples</span>
        </div>
        <div className="stat">
          <strong>{Object.keys(demosByTier).length}</strong>
          <span>Tiers</span>
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <Link
          to="/catalog"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#4fc3f7',
            color: '#000',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          📋 View Full Component Catalog
        </Link>
        <p style={{ marginTop: '12px', color: '#888', fontSize: '14px' }}>
          See all 137 components with status tracking and example links
        </p>
      </div>
    </div>
  )
}

//* Main App ==============================

function AppContent() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<ComponentCatalog />} />
          {demos.map((demo) => (
            <Route key={demo.path} path={demo.path} element={<demo.component />} />
          ))}
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
