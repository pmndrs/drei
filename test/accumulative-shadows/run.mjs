// CHROMIUM_EXECUTABLE_PATH may point at an existing Chrome installation.
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
      cacheDir: resolve(root, `node_modules/.vite-accumulative-${gpu ? 'webgpu' : 'webgl'}`),
      optimizeDeps: { entries: ['test/accumulative-shadows/index.html'] },
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-accumulative': resolve(
            root,
            gpu ? 'src/webgpu/Staging/AccumulativeShadows' : 'src/legacy/Materials/AccumulativeShadows'
          ),
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
      for (const scenario of ['bound', 'default', 'reset', 'render-error', 'light-error', 'clear-error']) {
        cases++
        const page = await browser.newPage()
        const errors = []
        page.on('response', (response) => {
          if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
        })
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }))
        try {
          await page.goto(`${server.resolvedUrls.local[0]}test/accumulative-shadows/index.html?scenario=${scenario}`)
          await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
          const result = await page.evaluate(() => window.result)
          console.log(JSON.stringify({ mode: gpu ? 'WebGPU' : 'WebGL', ...result, browserErrors: errors }))
          assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend or WebGL fallback')
          assert.deepEqual([...result.errors, ...errors], [], 'rendering errors')
          assert.equal(result.targets.length, 4, 'frame callbacks must run')
          assert.ok(result.targets.every(Boolean), 'caller target was lost')
          if (scenario === 'bound' || scenario === 'default') {
            assert.ok(result.renders[0] > 0 && result.renders[1] > 0, 'finite accumulation did not run')
            assert.deepEqual(result.renders.slice(2), [0, 0], 'finite accumulation kept running')
          } else {
            assert.equal(result.checks.length, 1)
            for (const [state, restored] of Object.entries(result.checks[0])) {
              assert.ok(restored, `${state} was not restored`)
            }
            assert.equal(result.caught, scenario === 'reset' ? undefined : `${scenario.split('-')[0]} sentinel`)
            assert.ok(result.renders[2] > 0, 'accumulator could not render after reset/failure')
          }
          if (scenario !== 'default') assert.deepEqual(result.pixel, [0, 255, 0, 255], 'continuation missed outer FBO')
        } catch (error) {
          failures++
          console.error(`${gpu ? 'WebGPU' : 'WebGL'} ${scenario}: ${error.message}`)
          if (errors.length) console.error(errors.join('\n'))
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
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} AccumulativeShadows scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
