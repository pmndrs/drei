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
  for (const mode of ['core-webgl', 'core-webgpu', 'legacy']) {
    if (process.env.TEST_MODE && mode !== process.env.TEST_MODE) continue
    const gpu = mode === 'core-webgpu'
    const server = await createServer({
      configFile: false,
      root,
      logLevel: 'error',
      cacheDir: resolve(root, `test-results/cube-vite-${mode}`),
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#three-addons': resolve(root, `src/utils/three-addons${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-cube': resolve(root, `src/${mode === 'legacy' ? 'legacy' : 'core'}/Portal/RenderCubeTexture`),
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
      for (const frames of [0, 1, 2, Infinity]) {
        cases++
        const page = await browser.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        try {
          await page.goto(`${server.resolvedUrls.local[0]}test/cube-capture/index.html?frames=${frames}`)
          await page.waitForFunction(() => window.result?.ready, null, { timeout: 30000 })
          const first = await page.evaluate(() => window.step('red'))
          const second = await page.evaluate(() => window.step('lime'))
          await page.evaluate(() => window.rerender())
          // Wait for the React commit while the scheduler is deliberately stopped.
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          )
          const third = await page.evaluate(() => window.step('blue'))
          const result = await page.evaluate(() => window.result)
          console.log(
            JSON.stringify({
              mode,
              frames: String(frames),
              first,
              second,
              third,
              errors: [...errors, ...result.errors],
            })
          )
          assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend/fallback')
          assert.deepEqual([...errors, ...result.errors], [], 'render errors')
          assert.equal(first.captures, frames === 0 ? 0 : 6, 'first demand frame capture count')
          assert.equal(third.captures, 6 * Math.min(frames, 3), 'finite budget restarted on rerender')
          if (frames > 0) {
            assert.ok(first.pixel[0] > 250 && first.pixel[1] < 5, 'first capture not displayed')
            const channel = frames === 1 ? 0 : frames === 2 ? 1 : 2
            assert.ok(
              third.pixel[channel] > 250 && third.pixel.filter((_, i) => i < 3 && i !== channel).every((v) => v < 5),
              'latest capture not displayed'
            )
            assert.ok(
              [first, second, third].every((sample) => sample.published),
              'attached texture differs from public FBO'
            )
          }
        } catch (error) {
          failures++
          console.error(`${mode} frames=${frames}: ${error.message}`)
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
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} cube capture scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
