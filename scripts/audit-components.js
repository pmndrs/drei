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
const OUT_TS = path.join(ROOT, 'component-status.generated.ts')
const OVERRIDES = path.join(ROOT, 'component-overrides.json')

/** Trees that hold components, in entry-point terms. */
const TREES = ['core', 'legacy', 'webgpu', 'external', 'experimental']

/** True if a test file actually asserts something. A placeholder is not a test. */
function hasAssertions(file) {
  return /\bexpect\(|\bassert[.(]|toBe|toEqual|toThrow|\brender\(/.test(read(file))
}

/** True if a file only re-exports — `export * from './x'`, comments, blank lines. */
function isBarrel(file) {
  const body = read(file)
    .split('\n')
    .filter((l) => l.trim() && !/^\s*(\/\/|\/\*|\*)/.test(l))
  return body.length > 0 && body.every((l) => /^\s*export \* from/.test(l))
}

/**
 * Find components in a tree. Three layouts occur in this repo, and missing any
 * of them silently under-reports — the audit claimed 139 components while
 * PivotControls, GizmoHelper, GizmoViewport and GizmoViewcube (all root-exported
 * public API) were invisible to it.
 *
 *   A. `<Name>/<Name>.tsx`     — Component-as-a-Folder, the convention
 *   B. `<Name>/index.tsx`      — implementation in the index (PivotControls)
 *   C. `<lowercase>/<Name>.tsx` — several components sharing a folder (gizmo/)
 *
 * A and B are keyed on the folder name; C on the file name. New components
 * should use layout A — B and C exist to describe what is already here.
 */
function findComponents(tree) {
  const base = path.join(SRC, tree)
  if (!fs.existsSync(base)) return []
  const found = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const full = path.join(dir, entry.name)

      // A — folder named for its implementation
      const impl = path.join(full, `${entry.name}.tsx`)
      const implTs = path.join(full, `${entry.name}.ts`)
      if (fs.existsSync(impl) || fs.existsSync(implTs)) {
        found.push({ name: entry.name, dir: full, file: fs.existsSync(impl) ? impl : implTs })
      } else {
        // B — implementation lives in index.tsx. A pure re-export barrel is not one.
        const index = path.join(full, 'index.tsx')
        if (fs.existsSync(index) && !isBarrel(index)) {
          found.push({ name: entry.name, dir: full, file: index })
        }
      }

      // C — a lowercase folder holding several PascalCase components
      if (/^[a-z]/.test(entry.name)) {
        for (const f of fs.readdirSync(full)) {
          if (!/^[A-Z][A-Za-z0-9]*\.tsx$/.test(f)) continue
          found.push({ name: f.replace(/\.tsx$/, ''), dir: full, file: path.join(full, f) })
        }
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
    // A test file that asserts nothing is not a test. All 64 co-located test
    // files were `it('TODO: Add tests after Phase 2', () => {})` — counting
    // them as coverage is the same "a file exists" mistake that made `done`
    // mean nothing. Report both so the gap is visible instead of flattering.
    testAsserts: hasAssertions(
      fs.existsSync(path.join(dir, `${name}.test.ts`))
        ? path.join(dir, `${name}.test.ts`)
        : path.join(dir, `${name}.test.tsx`)
    ),
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
      // `implemented` means a src/webgpu/ implementation EXISTS. It does not mean
      // the component works — nothing here renders anything. It was called `done`
      // and got read as a completion signal while 7 `done` components had open
      // bug reports and no story.
      if (inCore || t.external || t.experimental) classification = 'agnostic'
      else if (inWebgpu) classification = 'implemented'
      else classification = 'todo'

      const override = entry.name.startsWith('_') ? undefined : overrides[entry.name]
      if (override?.classification) classification = override.classification

      // Delegation heuristic: a port with no raw shader code is mechanical API
      // mapping. This is a guess from the LEGACY source, so it over-flags —
      // a thin wrapper around a trivial shader looks hard but is not. Override
      // it in component-overrides.json with an `assignee` plus a reason.
      const hard = !!(primary?.hasGlsl || primary?.hasOnBeforeCompile || primary?.hasShaderMaterial)
      const assignee = classification === 'todo' ? (override?.assignee ?? (hard ? 'human-only' : 'agent-ok')) : null

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
        testAsserts: Object.values(t).some((x) => x.testAsserts),
        docs: Object.values(t).some((x) => x.docs),
        // Per-tree, because the aggregate above hides the thing that matters:
        // `Grid` and `MeshDistortMaterial` both report `story: true`, but only
        // Grid's story renders the WebGPU implementation. Aggregating says 20
        // of 29 WebGPU components have a story; the real number is 2.
        coverageByTree: Object.fromEntries(
          Object.entries(t).map(([tree, x]) => [tree, { story: x.story, test: x.test, docs: x.docs }])
        ),
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
      implemented: count((c) => c.classification === 'implemented'),
      todo: count((c) => c.classification === 'todo'),
      wontPort: count((c) => c.classification === 'wont-port'),
      withStory: count((c) => c.story),
      webgpuImplemented: count((c) => c.trees.webgpu),
      webgpuWithStory: count((c) => c.coverageByTree?.webgpu?.story),
      withTestFile: count((c) => c.test),
      withRealTest: count((c) => c.testAsserts),
      withDocs: count((c) => c.docs),
      agentOk: count((c) => c.assignee === 'agent-ok'),
      humanOnly: count((c) => c.assignee === 'human-only'),
    },
    components,
  }
}

/**
 * Emit a typed TS module for the UI consumers (the examples dashboard and the
 * Storybook catalog). They used to hand-type these fields, and both drifted —
 * the examples registry had `tests` wrong on 55 of 140 entries and
 * `webgpuStatus` wrong on 19 of 33. Anything derivable is derived here so the
 * dashboards cannot disagree with the filesystem again.
 */
function emitTs(status) {
  const rendererSupport = (c) => {
    const { core, legacy, webgpu, external, experimental } = c.trees
    if (core || external || experimental) return 'universal'
    if (legacy && webgpu) return 'dual'
    if (webgpu) return 'webgpu-only'
    if (legacy) return 'legacy-only'
    return 'unknown'
  }

  const rows = status.components.map((c) => ({
    name: c.name,
    category: c.category,
    classification: c.classification,
    rendererSupport: rendererSupport(c),
    story: c.story,
    test: c.test,
    /** The test file asserts something. `test` alone only means a file exists. */
    testAsserts: c.testAsserts,
    docs: c.docs,
    legacy: c.trees.legacy,
    webgpu: c.trees.webgpu,
    // A story that renders the WebGPU implementation specifically. This is the
    // number that matters and the aggregate `story` hides it.
    webgpuStory: !!c.coverageByTree?.webgpu?.story,
    legacyStory: !!c.coverageByTree?.legacy?.story,
    assignee: c.assignee,
    reason: c.reason,
  }))

  const body = rows.map((r) => `  ${JSON.stringify(r.name)}: ${JSON.stringify(r)},`).join('\n')

  return `// GENERATED by scripts/audit-components.js — DO NOT EDIT.
// Run \`yarn audit:components\`. \`yarn test:components\` fails if this is stale.
//
// \`classification: 'implemented'\` means a file exists under src/webgpu/.
// It is NOT a claim that the component works.

export type RendererSupport = 'universal' | 'dual' | 'legacy-only' | 'webgpu-only' | 'unknown'
export type Classification = 'agnostic' | 'implemented' | 'todo' | 'wont-port'

export interface ComponentStatus {
  name: string
  category: string
  classification: Classification
  rendererSupport: RendererSupport
  story: boolean
  test: boolean
  /** The test file asserts something. \`test\` alone only means a file exists. */
  testAsserts: boolean
  docs: boolean
  legacy: boolean
  webgpu: boolean
  /** A story that renders the WebGPU implementation. Not the same as \`story\`. */
  webgpuStory: boolean
  legacyStory: boolean
  assignee: 'agent-ok' | 'human-only' | null
  reason: string | null
}

export const componentStatus: Record<string, ComponentStatus> = {
${body}
}

export const componentStatusTotals = ${JSON.stringify(status.totals, null, 2)} as const

/** Status for a component, or \`undefined\` if the audit does not know it. */
export function statusFor(name: string): ComponentStatus | undefined {
  return componentStatus[name]
}
`
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
  const staleTs = fs.existsSync(OUT_TS) && read(OUT_TS).trim() !== emitTs(status).trim()
  if (staleTs) problems.push('component-status.generated.ts is out of date — run `node scripts/audit-components.js`')
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
  console.log(
    `  implemented${String(t.implemented).padStart(3)}   a src/webgpu/ file exists — NOT a claim that it works`
  )
  console.log(`  todo       ${String(t.todo).padStart(3)}   ${t.agentOk} agent-ok / ${t.humanOnly} human-only`)
  console.log(`  wont-port  ${String(t.wontPort).padStart(3)}`)
  console.log(`\n  stories    ${String(t.withStory).padStart(3)} / ${t.components}`)
  console.log(`  test files ${String(t.withTestFile).padStart(3)} / ${t.components}`)
  console.log(`  REAL tests ${String(t.withRealTest).padStart(3)} / ${t.components}   (the rest assert nothing)`)
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
fs.writeFileSync(OUT_TS, emitTs(status))
console.log(
  `✓ wrote ${path.relative(ROOT, OUT)} and ${path.relative(ROOT, OUT_TS)} — ${status.totals.components} components`
)
