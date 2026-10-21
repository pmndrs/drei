// Run with node test/caustics/run.mjs; CHROMIUM_EXECUTABLE_PATH can select an installed Chrome.
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
      cacheDir: resolve(root, `node_modules/.vite-caustics-${gpu ? 'webgpu' : 'webgl'}`),
      optimizeDeps: { entries: ['test/caustics/index.html'] },
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#three-addons': resolve(root, `src/utils/three-addons${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-caustics': resolve(root, gpu ? 'src/webgpu/Effects/Caustics' : 'src/legacy/Materials/Caustics'),
          '@legacy': resolve(root, 'src/legacy'),
          '@webgpu': resolve(root, 'src/webgpu'),
          '@utils': resolve(root, 'src/utils'),
          '@core': resolve(root, 'src/core'),
        },
      },
      server: { host: '127.0.0.1', port: 0 },
    })
    await server.listen()
    try {
      for (const scenario of ['bound', 'default', 'cube', 'mip', 'only', 'finite', 'zero', 'error']) {
        if (process.env.TEST_SCENARIOS && !process.env.TEST_SCENARIOS.split(',').includes(scenario)) continue
        cases++
        const page = await browser.newPage()
        const errors = []
        const expectedErrors = []
        const record = (message) => {
          if (scenario === 'error' && message.includes('Expected caustics render failure')) expectedErrors.push(message)
          else errors.push(message)
        }
        page.on('pageerror', (error) => record(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') record(message.text())
        })
        try {
          await page.goto(`${server.resolvedUrls.local[0]}test/caustics/index.html?scenario=${scenario}`)
          await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
          const result = await page.evaluate(() => window.result)
          console.log(JSON.stringify({ mode: gpu ? 'WebGPU' : 'WebGL', ...result, browserErrors: errors }))
          assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend/fallback')
          assert.deepEqual([...result.errors, ...errors], [], 'rendering errors')
          assert.equal(result.targets.length, scenario === 'error' ? 1 : 3)
          assert.ok(result.targets.every(Boolean), 'caller target was lost')
          assert.ok(result.subresources.every(Boolean), 'caller face/mip was lost')
          assert.ok(result.transforms.every(Boolean), 'parent world transform was changed')
          assert.ok(result.scenes.every(Boolean), 'scene override material was lost')
          assert.ok(result.visibility.every(Boolean), 'content visibility was incorrect')
          if (scenario === 'error')
            assert.ok(result.injected && expectedErrors.length > 0, 'expected render did not throw')
          else if (scenario === 'zero') assert.deepEqual(result.renders, [0, 0, 0])
          else if (scenario === 'finite') {
            assert.ok(result.renders[0] > 0)
            assert.deepEqual(result.renders.slice(1), [0, 0])
          } else
            assert.ok(
              result.renders.every((count) => count >= (scenario === 'only' ? 4 : 2)),
              'offscreen passes did not run'
            )
          if (!['default', 'mip', 'error'].includes(scenario))
            assert.deepEqual(result.pixel, [0, 255, 0, 255], 'continuation missed caller target')
        } catch (error) {
          failures++
          console.error(`${gpu ? 'WebGPU' : 'WebGL'} ${scenario}: ${error.message}`)
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
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} Caustics scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
