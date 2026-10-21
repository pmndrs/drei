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
  for (const mode of ['core-webgl', 'core-webgpu', 'legacy', 'texture-webgl', 'texture-webgpu']) {
    if (process.env.TEST_MODE && mode !== process.env.TEST_MODE) continue
    const gpu = mode.endsWith('webgpu')
    const texture = mode.startsWith('texture')
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
          '#test-texture': resolve(root, 'src/core/Portal/RenderTexture'),
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
      for (const [frames, binding] of [
        ...[0, 1, 2, Infinity].map((frames) => [frames, 'map']),
        ...(texture
          ? [
              [2, 'path'],
              [2, 'callback'],
              [1, 'throw'],
            ]
          : []),
      ]) {
        if (process.env.TEST_BINDING && process.env.TEST_BINDING !== binding) continue
        cases++
        const page = await browser.newPage()
        const errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
          if (message.type() === 'error' && !message.text().includes('texture-capture-test-error'))
            errors.push(message.text())
        })
        try {
          await page.goto(
            `${server.resolvedUrls.local[0]}test/cube-capture/index.html?${new URLSearchParams({ frames: String(frames), kind: texture ? 'texture' : 'cube', binding })}`
          )
          await page.waitForFunction(() => window.result?.ready, null, { timeout: 30000 })
          const first = await page.evaluate(() => window.step('red'))
          const second = await page.evaluate(() => window.step('lime'))
          await page.evaluate(() => window.rerender())
          // Wait for the React commit while the scheduler is deliberately stopped.
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          )
          const third = await page.evaluate(() => window.step('blue'))
          const cleanup = texture ? await page.evaluate(() => window.remove()) : null
          const result = await page.evaluate(() => window.result)
          console.log(
            JSON.stringify({
              mode,
              frames: String(frames),
              binding,
              cleanup,
              first,
              second,
              third,
              errors: [...errors, ...result.errors],
            })
          )
          assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected backend/fallback')
          assert.deepEqual([...errors, ...result.errors], [], 'render errors')
          const faces = texture ? 1 : 6
          if (binding === 'throw') {
            assert.ok(result.thrown && result.caught, 'render error must execute and propagate')
            assert.equal(first.captures, 0, 'failed capture counted as complete')
            assert.equal(third.captures, 1, 'finite capture must retry once and then stop')
            assert.ok(
              [first, second, third].every((sample) => sample.stateRestored),
              'caller renderer state leaked'
            )
            assert.ok(third.pixel[1] > 250 && third.pixel[0] < 5 && third.published, 'recovered capture not displayed')
            assert.ok(Object.values(cleanup).every(Boolean), 'cleanup failed after recovery')
            continue
          }
          assert.equal(first.captures, frames === 0 ? 0 : faces, 'first demand frame capture count')
          assert.equal(third.captures, faces * Math.min(frames, 3), 'finite budget restarted on rerender')
          if (texture) assert.ok(Object.values(cleanup).every(Boolean), 'attachment/ref cleanup failed')
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
            if (texture) {
              assert.ok(
                [first, second, third].every((sample) => sample.properties),
                'texture props lost on swapped buffer'
              )
              if (binding !== 'callback') assert.equal(third.version, first.version, 'texture swaps recompile material')
            }
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
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} texture capture scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
