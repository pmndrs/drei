import assert from 'node:assert/strict'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from '@playwright/test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
})
let failures = 0
let cases = 0
try {
  for (const gpu of [false, true]) {
    const server = await createServer({
      configFile: false,
      root,
      logLevel: 'error',
      cacheDir: resolve(root, `test-results/portal-sdf-${gpu ? 'webgpu' : 'webgl'}`),
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#three-addons': resolve(root, `src/utils/three-addons${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-portal': resolve(root, `src/${gpu ? 'webgpu' : 'legacy'}/Materials/MeshPortalMaterial`),
          '#test-post-processing': resolve(
            root,
            `test/portal-sdf-state/post-processing-${gpu ? 'webgpu' : 'webgl'}.ts`
          ),
          '@core': resolve(root, 'src/core'),
          '@legacy': resolve(root, 'src/legacy'),
          '@webgpu': resolve(root, 'src/webgpu'),
          '@utils': resolve(root, 'src/utils'),
        },
      },
      server: { host: '127.0.0.1', port: 0 },
    })
    await server.listen()
    try {
      for (const [target, throwPass] of [
        ['bound', 0],
        ['default', 0],
        ['cube', 0],
        ['mip', 0],
        ['cube', 1],
        ['cube', 2],
      ]) {
        cases++
        const page = await browser.newPage()
        const errors = [],
          expectedErrors = []
        const record = (message) =>
          (throwPass && message.includes('portal-sdf-test-injected-error') ? expectedErrors : errors).push(message)
        page.on('pageerror', (e) => record(e.message))
        page.on('console', (e) => {
          if (e.type() === 'error') record(e.text())
        })
        try {
          await page.goto(
            `${server.resolvedUrls.local[0]}test/portal-sdf-state/index.html?${new URLSearchParams({ target, throwPass: String(throwPass) })}`
          )
          await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
          const result = await page.evaluate(() => window.result)
          console.log(JSON.stringify({ mode: gpu ? 'WebGPU' : 'WebGL', ...result, browserErrors: errors }))
          assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend/fallback')
          assert.deepEqual([...result.errors, ...errors], [])
          assert.ok(result.capturesAtCleanup > 0, 'SDF initialization did not render')
          assert.ok(Object.values(result.state).every(Boolean), 'caller state lost during SDF initialization')
          if (throwPass) assert.ok(result.thrown && expectedErrors.length > 0, 'render exception did not propagate')
          if (target === 'bound') assert.deepEqual(result.pixel, [0, 255, 0, 255])
        } catch (error) {
          failures++
          console.error(`${gpu ? 'WebGPU' : 'WebGL'} ${target} throwPass=${throwPass}: ${error.message}`)
        } finally {
          await page.close()
        }
      }
    } finally {
      await server.close()
    }
  }
} finally {
  await browser.close()
}
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} portal SDF scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
