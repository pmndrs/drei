import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'

//* Component Catalog (Master Index) ==============================
import ComponentCatalog from './catalog/ComponentCatalog'
import { Sidebar } from './components/Sidebar'
import { demos, getTier } from './demos/componentRegistry'
import { cn } from './lib/utils'

//* Home Page ==============================

function Home() {
  const tierCount = [...new Set(demos.map((d) => getTier(d)))].length

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
          <strong>{tierCount}</strong>
          <span>Tiers</span>
        </div>
      </div>

      <div className="mt-8">
        <Link
          to="/catalog"
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3',
            'bg-primary text-primary-foreground',
            'rounded-lg font-semibold',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          📋 View Full Component Catalog
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
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
          {demos
            .filter((demo) => demo.component)
            .map((demo) => (
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
