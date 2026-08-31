/**
 * Derive component status from the filesystem.
 *
 * The hand-maintained registry drifted badly — it claimed 27 components still
 * needed TSL conversion when implementations existed for 17 of them, and marked
 * every component as untested while 64 test files sat in the tree. Anything the
 * filesystem already knows should never be typed by hand again.
 *
 * Usage:
 *   node scripts/audit-components.js            # write component-status.json
 *   node scripts/audit-components.js --check    # verify overrides, exit 1 on drift
 *   node scripts/audit-components.js --summary  # human-readable table
 *
 * DERIVED (never hand-edited): which trees a component exists in, whether it has
 * a story / test / docs page, which three import style it uses, and whether it
 * contains GLSL, onBeforeCompile or ShaderMaterial.
 *
 * HAND-MAINTAINED: component-overrides.json only, holding `classification` and a
 * required `reason` for anything deliberately not ported. --check fails if an
 * override names a component that no longer exists, so it cannot rot silently.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')
const OUT = path.join(ROOT, 'component-status.json')
const OVERRIDES = path.join(ROOT, 'component-overrides.json')

/** Trees that hold components, in entry-point terms. */
const TREES = ['core', 'legacy', 'webgpu', 'external', 'experimental']

/** A leaf component folder is one containing `<Name>.tsx` matching its own name. */
function findComponents(tree) {
  const base = path.join(SRC, tree)
  if (!fs.existsSync(base)) return []
  const found = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const full = path.join(dir, entry.name)
      const impl = path.join(full, `${entry.name}.tsx`)
      const implTs = path.join(full, `${entry.name}.ts`)
      if (fs.existsSync(impl) || fs.existsSync(implTs)) {
        found.push({ name: entry.name, dir: full, file: fs.existsSync(impl) ? impl : implTs })
      }
      walk(full)
    }
  }
  walk(base)
  return found
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

function inspect(component, tree) {
  const { name, dir, file } = component
  const source = read(file)
  const rel = path.relative(ROOT, dir)
  const category = path.relative(path.join(SRC, tree), path.dirname(dir)) || '(root)'

  return {
    name,
    tree,
    category,
    path: rel,
    story: fs.existsSync(path.join(dir, `${name}.stories.tsx`)),
    test: fs.existsSync(path.join(dir, `${name}.test.ts`)) || fs.existsSync(path.join(dir, `${name}.test.tsx`)),
    docs: fs.existsSync(path.join(dir, `${name}.docs.mdx`)),
    // import style — `#three` is the platform alias, bare `three` is not portable
    usesAlias: /from '#three/.test(source),
    usesBareThree: /from 'three'/.test(source),
    usesTsl: /from 'three\/tsl'/.test(source),
    // the patterns that make a WebGPU port hard or impossible
    hasGlsl: /\bglsl`|from 'glslify'|glsl-noise/.test(source),
    hasOnBeforeCompile: /onBeforeCompile/.test(source),
    hasShaderMaterial: /\bShaderMaterial\b/.test(source),
  }
}

function build() {
  const all = []
  for (const tree of TREES) for (const c of findComponents(tree)) all.push(inspect(c, tree))

  // Group by name so a component's legacy and webgpu halves sit together.
  const byName = new Map()
  for (const c of all) {
    if (!byName.has(c.name)) byName.set(c.name, { name: c.name, trees: {} })
    byName.get(c.name).trees[c.tree] = c
  }

  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(read(OVERRIDES)) : {}

  const components = [...byName.values()]
    .map((entry) => {
      const t = entry.trees
      const inCore = !!t.core
      const inLegacy = !!t.legacy
      const inWebgpu = !!t.webgpu
      const primary = t.core ?? t.legacy ?? t.webgpu ?? t.external ?? t.experimental

      // Classification is derived unless an override says otherwise.
      let classification
      if (inCore || t.external || t.experimental) classification = 'agnostic'
      else if (inWebgpu) classification = 'done'
      else classification = 'todo'

      const override = entry.name.startsWith('_') ? undefined : overrides[entry.name]
      if (override?.classification) classification = override.classification

      // Delegation: a port with no raw shader code is mechanical API mapping.
      const hard = !!(primary?.hasGlsl || primary?.hasOnBeforeCompile || primary?.hasShaderMaterial)
      const assignee = classification === 'todo' ? (hard ? 'human-only' : 'agent-ok') : null

      return {
        name: entry.name,
        category: primary?.category ?? '(unknown)',
        classification,
        reason: override?.reason ?? null,
        assignee,
        trees: {
          core: inCore,
          legacy: inLegacy,
          webgpu: inWebgpu,
          external: !!t.external,
          experimental: !!t.experimental,
        },
        story: Object.values(t).some((x) => x.story),
        test: Object.values(t).some((x) => x.test),
        docs: Object.values(t).some((x) => x.docs),
        shaderRisk: {
          glsl: !!primary?.hasGlsl,
          onBeforeCompile: !!primary?.hasOnBeforeCompile,
          shaderMaterial: !!primary?.hasShaderMaterial,
        },
        paths: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.path])),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const count = (fn) => components.filter(fn).length
  return {
    generated: 'derived from the filesystem by scripts/audit-components.js — do not hand-edit',
    totals: {
      components: components.length,
      agnostic: count((c) => c.classification === 'agnostic'),
      done: count((c) => c.classification === 'done'),
      todo: count((c) => c.classification === 'todo'),
      wontPort: count((c) => c.classification === 'wont-port'),
      withStory: count((c) => c.story),
      withTest: count((c) => c.test),
      withDocs: count((c) => c.docs),
      agentOk: count((c) => c.assignee === 'agent-ok'),
      humanOnly: count((c) => c.assignee === 'human-only'),
    },
    components,
  }
}

function checkOverrides(status) {
  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(read(OVERRIDES)) : {}
  const known = new Set(status.components.map((c) => c.name))
  const problems = []

  for (const [name, o] of Object.entries(overrides)) {
    if (name.startsWith('_')) continue // _comment and friends are documentation, not entries
    if (!known.has(name)) problems.push(`override "${name}" names a component that no longer exists`)
    if (o.classification === 'wont-port' && !o.reason)
      problems.push(`override "${name}" is wont-port but has no reason`)
  }
  return problems
}

const args = process.argv.slice(2)
const status = build()

if (args.includes('--check')) {
  const problems = checkOverrides(status)
  const stale = fs.existsSync(OUT) && read(OUT).trim() !== JSON.stringify(status, null, 2).trim()
  if (stale) problems.push('component-status.json is out of date — run `node scripts/audit-components.js`')
  if (problems.length) {
    console.error('✗ component audit failed:')
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log(`✓ component audit clean (${status.totals.components} components)`)
  process.exit(0)
}

if (args.includes('--summary')) {
  const t = status.totals
  console.log(`\n${t.components} components\n`)
  console.log(`  agnostic   ${String(t.agnostic).padStart(3)}   works on both renderers`)
  console.log(`  done       ${String(t.done).padStart(3)}   has a WebGPU implementation`)
  console.log(`  todo       ${String(t.todo).padStart(3)}   ${t.agentOk} agent-ok / ${t.humanOnly} human-only`)
  console.log(`  wont-port  ${String(t.wontPort).padStart(3)}`)
  console.log(`\n  stories    ${String(t.withStory).padStart(3)} / ${t.components}`)
  console.log(`  tests      ${String(t.withTest).padStart(3)} / ${t.components}`)
  console.log(`  docs       ${String(t.withDocs).padStart(3)} / ${t.components}\n`)
  const todo = status.components.filter((c) => c.classification === 'todo')
  if (todo.length) {
    console.log('  still to port:')
    for (const c of todo) console.log(`    ${c.assignee === 'human-only' ? '👤' : '🤖'} ${c.name}  (${c.category})`)
    console.log()
  }
  process.exit(0)
}

fs.writeFileSync(OUT, JSON.stringify(status, null, 2) + '\n')
console.log(`✓ wrote ${path.relative(ROOT, OUT)} — ${status.totals.components} components`)
