import { Link, useLocation } from 'react-router-dom'
import { demos, type Demo, getTier, type Tier } from '../demos/componentRegistry'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { cn } from '../lib/utils'

//* Organize Demos by Tier/Category ==============================
// We derive tier from category using getTier helper

const demosByTier = demos.reduce(
  (acc, demo) => {
    const tier = getTier(demo)
    if (!acc[tier]) acc[tier] = {}
    if (!acc[tier][demo.category]) acc[tier][demo.category] = []
    acc[tier][demo.category].push(demo)
    return acc
  },
  {} as Record<Tier, Record<string, Demo[]>>
)

//* Demo Link Component ==============================

function DemoLink({ demo }: { demo: Demo }) {
  const location = useLocation()
  const isActive = location.pathname === demo.path

  return (
    <Link
      to={demo.path}
      className={cn(
        'block py-2 px-3 text-sm rounded-md transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        isActive && 'bg-primary/15 text-primary font-medium'
      )}
    >
      {demo.name}
    </Link>
  )
}

//* Category Section (Collapsible) ==============================

function CategorySection({ category, demos }: { category: string; demos: Demo[] }) {
  return (
    <AccordionItem value={category} className="border-none">
      <AccordionTrigger className="py-2.5 px-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:no-underline rounded-md hover:bg-accent/50">
        <span className="capitalize">{category}</span>
        <span className="ml-auto mr-2 text-xs text-muted-foreground/60 tabular-nums">{demos.length}</span>
      </AccordionTrigger>
      <AccordionContent className="pb-1">
        <div className="flex flex-col gap-0.5 pl-3">
          {demos.map((demo) => (
            <DemoLink key={demo.path} demo={demo} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

//* Tier Section ==============================

function TierSection({ tier, categories }: { tier: string; categories: Record<string, Demo[]> }) {
  const categoryNames = Object.keys(categories)

  return (
    <div className="mb-2">
      {/* Tier Header */}
      <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/50">{tier}</div>

      {/* Categories Accordion */}
      <Accordion type="multiple" defaultValue={categoryNames} className="px-3">
        {Object.entries(categories).map(([category, items]) => (
          <CategorySection key={category} category={category} demos={items} />
        ))}
      </Accordion>
    </div>
  )
}

//* Main Sidebar ==============================

export function Sidebar() {
  const location = useLocation()
  const tierOrder: Tier[] = ['core', 'external', 'experimental']

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="px-5 py-6 border-b border-border shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">Drei v11</h1>
        <p className="text-sm text-muted-foreground mt-1">Component Examples</p>
      </div>

      {/* Catalog Link */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <Link
          to="/catalog"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
            'bg-secondary/80 hover:bg-secondary',
            location.pathname === '/catalog' && 'bg-primary text-primary-foreground'
          )}
        >
          <span>📋</span>
          <span>Component Catalog</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {tierOrder.map((tier) => {
          const categories = demosByTier[tier]
          if (!categories || Object.keys(categories).length === 0) return null
          return <TierSection key={tier} tier={tier} categories={categories} />
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border text-xs text-muted-foreground shrink-0">
        <div className="flex justify-between">
          <span>{demos.length} examples</span>
          <span>{tierOrder.filter((t) => demosByTier[t]).length} tiers</span>
        </div>
      </div>
    </div>
  )
}
