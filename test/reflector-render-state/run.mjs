import assert from 'node:assert/strict'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const server = await createServer({
  configFile: false,
  root,
  logLevel: 'error',
  cacheDir: resolve(root, 'test-results/reflector-vite'),
  resolve: {
    alias: {
      '#three': 'three',
      '#drei-platform': resolve(root, 'src/utils/drei-platform.ts'),
      '#three-addons': resolve(root, 'src/utils/three-addons.ts'),
      '@core': resolve(root, 'src/core'),
      '@legacy': resolve(root, 'src/legacy'),
      '@utils': resolve(root, 'src/utils'),
    },
  },
  server: { host: '127.0.0.1', port: 0 },
})
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
})
let failures = 0
let cases = 0
try {
  await server.listen()
  for (const blur of [false, true]) {
    for (const [scenario, throwPass] of [
      ['bound', 0],
      ['default', 0],
      ['cube', 0],
      ['mip', 0],
      ['hidden', 0],
      ['bound', 1],
      ...(blur ? [['bound', 2]] : []),
    ]) {
      cases++
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (e) => {
        if (e.type() === 'error' && !e.text().includes('reflector-test-injected-error')) errors.push(e.text())
      })
      try {
        await page.goto(
          `${server.resolvedUrls.local[0]}test/reflector-render-state/index.html?${new URLSearchParams({ scenario, blur: String(blur), throwPass: String(throwPass) })}`
        )
        await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
        const result = await page.evaluate(() => window.result)
        console.log(JSON.stringify({ ...result, browserErrors: errors }))
        assert.equal(result.backend, 'WebGL')
        assert.deepEqual([...result.errors, ...errors], [])
        assert.equal(result.targets.length, throwPass ? 1 : 3)
        assert.ok(result.targets.every(Boolean), 'caller target lost')
        assert.ok(
          result.states.every((s) => Object.values(s).every(Boolean)),
          'caller state lost'
        )
        assert.ok(result.renders[0] > 0, 'reflection did not render')
        if (throwPass) assert.ok(result.thrown && result.caught, 'render exception did not propagate')
        if (scenario !== 'default' && scenario !== 'mip') assert.deepEqual(result.pixel, [0, 255, 0, 255])
      } catch (error) {
        failures++
        console.error(`${scenario} blur=${blur} throwPass=${throwPass}: ${error.message}`)
      } finally {
        await page.close()
      }
    }
  }
} finally {
  await server.close()
  await browser.close()
}
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} reflector scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
