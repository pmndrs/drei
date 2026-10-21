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
    if (process.env.TEST_BACKEND && process.env.TEST_BACKEND !== (gpu ? 'WebGPU' : 'WebGL')) continue
    const server = await createServer({
      configFile: false,
      root,
      logLevel: 'error',
      cacheDir: resolve(root, `test-results/transmission-vite-${gpu ? 'webgpu' : 'webgl'}`),
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#three-addons': resolve(root, `src/utils/three-addons${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-transmission': resolve(root, `src/${gpu ? 'webgpu' : 'legacy'}/Materials/MeshTransmissionMaterial`),
          '#test-post-processing': resolve(
            root,
            `test/transmission-render-state/post-processing-${gpu ? 'webgpu' : 'webgl'}.ts`
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
      for (const backside of [false, true]) {
        const scenarios = [
          ['bound', 0],
          ['default', 0],
          ['nested', 0],
          ['array', 0],
          ['bound', 1],
          ...(backside ? [['bound', 2]] : []),
        ]
        for (const [scenario, throwPass] of scenarios) {
          if (process.env.TEST_SCENARIO && process.env.TEST_SCENARIO !== scenario) continue
          cases++
          const page = await browser.newPage()
          const errors = []
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('console', (message) => {
            if (message.type() === 'error' && !message.text().includes('transmission-test-injected-error'))
              errors.push(message.text())
          })
          try {
            await page.goto(
              `${server.resolvedUrls.local[0]}test/transmission-render-state/index.html?${new URLSearchParams({ scenario, backside: String(backside), throwPass: String(throwPass) })}`
            )
            await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
            const result = await page.evaluate(() => window.result)
            console.log(JSON.stringify({ mode: gpu ? 'WebGPU' : 'WebGL', ...result, browserErrors: errors }))
            assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend/fallback')
            assert.deepEqual([...result.errors, ...errors], [], 'render errors')
            assert.ok(result.targets.every(Boolean), 'caller target lost')
            assert.ok(
              result.states.every((state) => Object.values(state).every(Boolean)),
              'caller scene/material state lost'
            )
            assert.ok(result.renders[0] >= (backside ? 2 : 1) || throwPass === 1, 'capture did not execute')
            if (throwPass) assert.ok(result.thrown, 'error path not exercised')
            if (scenario !== 'default')
              assert.ok(
                result.pixel[0] < 5 && result.pixel[1] > 250 && result.pixel[2] < 5,
                'continuation/post-processing not green'
              )
          } catch (error) {
            failures++
            console.error(
              `${gpu ? 'WebGPU' : 'WebGL'} ${scenario} backside=${backside} throwPass=${throwPass}: ${error.message}`
            )
          } finally {
            await page.close()
          }
        }
      }
    } finally {
      await server.close()
    }
  }
} finally {
  await browser.close()
}
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} transmission state scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
