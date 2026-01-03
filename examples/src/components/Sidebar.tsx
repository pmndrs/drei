import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { demos, type Demo } from '../demos/demoList'

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

export function Sidebar() {
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
