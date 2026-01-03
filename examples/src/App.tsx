import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'

//* Component Catalog (Master Index) ==============================
import ComponentCatalog from './catalog/ComponentCatalog'
import { Sidebar } from './components/Sidebar'

import { demos, type Demo } from './demos/demoList'

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
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppContent />
    </BrowserRouter>
  )
}
