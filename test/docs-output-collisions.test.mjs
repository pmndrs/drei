import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
function fixture(t, components) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'drei-docs-')))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  fs.mkdirSync(path.join(dir, 'scripts'))
  for (const name of ['generate-docs.ts', 'docs-config.js']) {
    fs.copyFileSync(path.join(root, 'scripts', name), path.join(dir, 'scripts', name))
  }
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}')
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  for (const [tier, name] of components) {
    const folder = path.join(dir, 'src', tier, 'Staging', name)
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(
      path.join(folder, `${name}.tsx`),
      `import * as React from 'react'\n/**\n * ${tier} documentation.\n */\nexport const ${name} = (props: { color?: string }): React.JSX.Element => React.createElement('group', props)\n`
    )
  }
  return dir
}
function generate(dir, args = []) {
  return spawnSync(
    process.execPath,
    [
      '--no-warnings',
      '--loader',
      path.join(root, 'node_modules/ts-node/esm.mjs'),
      path.join(dir, 'scripts/generate-docs.ts'),
      ...args,
    ],
    {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        CHOKIDAR_USEPOLLING: 'true',
        TS_NODE_TRANSPILE_ONLY: 'true',
        TS_NODE_PROJECT: path.join(root, 'tsconfig.json'),
      },
      timeout: 30000,
    }
  )
}

test('colliding components fail before changing any documentation or making a backup', (t) => {
  const dir = fixture(t, [
    ['core', 'Grid'],
    ['experimental', 'Grid'],
    ['core', 'Another'],
  ])
  const docs = path.join(dir, 'docs', 'staging')
  fs.mkdirSync(docs, { recursive: true })
  fs.writeFileSync(path.join(docs, 'grid.mdx'), 'hand-written documentation')
  const result = generate(dir)
  assert.notEqual(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stderr, /core[/\\]Staging[/\\]Grid/)
  assert.match(result.stderr, /experimental[/\\]Staging[/\\]Grid/)
  assert.match(result.stderr, /grid\.mdx/)
  assert.equal(fs.readFileSync(path.join(docs, 'grid.mdx'), 'utf8'), 'hand-written documentation')
  assert.deepEqual(fs.readdirSync(docs), ['grid.mdx'])
  assert.equal(fs.existsSync(path.join(dir, 'docs-original')), false)
})

test('distinct components still generate documentation', (t) => {
  const dir = fixture(t, [
    ['core', 'Grid'],
    ['experimental', 'Stars'],
  ])
  const result = generate(dir, ['--no-backup'])
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(fs.readFileSync(path.join(dir, 'docs/staging/grid.mdx'), 'utf8'), /core documentation/)
  assert.match(fs.readFileSync(path.join(dir, 'docs/staging/stars.mdx'), 'utf8'), /experimental documentation/)
})

test('watch mode reports a colliding addition without overwriting the existing page', async (t) => {
  const dir = fixture(t, [['core', 'Grid']])
  const { spawn } = await import('node:child_process')
  const child = spawn(
    process.execPath,
    [
      '--no-warnings',
      '--loader',
      path.join(root, 'node_modules/ts-node/esm.mjs'),
      path.join(dir, 'scripts/generate-docs.ts'),
      '--no-backup',
      '--watch',
    ],
    {
      cwd: dir,
      env: {
        ...process.env,
        CHOKIDAR_USEPOLLING: 'true',
        TS_NODE_TRANSPILE_ONLY: 'true',
        TS_NODE_PROJECT: path.join(root, 'tsconfig.json'),
      },
    }
  )
  let output = ''
  child.stdout.on('data', (data) => {
    output += data
  })
  child.stderr.on('data', (data) => {
    output += data
  })
  const waitFor = async (text) => {
    const deadline = Date.now() + 15000
    while (!output.includes(text)) {
      assert.equal(child.exitCode, null, output)
      assert.ok(Date.now() < deadline, output)
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
  try {
    await waitFor('Watching:')
    // Chokidar must finish its initial scan before the new file is added.
    await new Promise((resolve) => setTimeout(resolve, 500))
    const target = path.join(dir, 'docs/staging/grid.mdx')
    const before = fs.readFileSync(target, 'utf8')
    const folder = path.join(dir, 'src/experimental/Staging/Grid')
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(
      path.join(folder, 'Grid.tsx'),
      fs
        .readFileSync(path.join(dir, 'src/core/Staging/Grid/Grid.tsx'), 'utf8')
        .replace('core documentation', 'experimental documentation')
    )
    await waitFor('Documentation output collision')
    assert.equal(fs.readFileSync(target, 'utf8'), before)
    assert.equal(child.exitCode, null)
  } finally {
    const closed = new Promise((resolve) => child.once('close', resolve))
    child.kill()
    await closed
  }
})
