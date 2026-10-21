// Real-browser regression: node test/render-target/run.mjs
// Set CHROMIUM_EXECUTABLE_PATH to use an existing Chromium installation.
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
      resolve: {
        alias: {
          '#three': gpu ? 'three/webgpu' : 'three',
          '#drei-platform': resolve(root, `src/utils/drei-platform${gpu ? '-webgpu' : ''}.ts`),
          '#three-addons': resolve(root, `src/utils/three-addons${gpu ? '-webgpu' : ''}.ts`),
          '#test-fiber': gpu ? '@react-three/fiber' : '@react-three/fiber/legacy',
          '#test-contact-shadows': resolve(
            root,
            gpu ? 'src/webgpu/Staging/ContactShadows' : 'src/legacy/Materials/ContactShadows'
          ),
          '#test-depth-buffer': resolve(
            root,
            gpu ? 'src/webgpu/Helpers/useDepthBuffer' : 'src/core/Helpers/useDepthBuffer'
          ),
          '#test-post-processing': resolve(root, `test/render-target/post-processing-${gpu ? 'webgpu' : 'webgl'}.ts`),
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
      const origin = server.resolvedUrls.local[0]
      for (const component of gpu ? ['depth', 'gpu-depth', 'contact'] : ['depth', 'contact']) {
        if (process.env.TEST_COMPONENT && component !== process.env.TEST_COMPONENT) continue
        for (const [scenario, frames] of [
          ['bound', 'Infinity'],
          ['default', 'Infinity'],
          ['bound', '1'],
          ['bound', '0'],
          ['nested', 'Infinity'],
          ['cube', 'Infinity'],
          ['mip', 'Infinity'],
        ]) {
          if (process.env.TEST_SCENARIO && scenario !== process.env.TEST_SCENARIO) continue
          cases++
          const page = await browser.newPage()
          const errors = []
          page.on('pageerror', (error) => errors.push(error.message))
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text())
          })
          try {
            await page.goto(
              `${origin}test/render-target/index.html?${new URLSearchParams({ component, scenario, frames })}`
            )
            await page.waitForFunction(() => window.result?.done, null, { timeout: 30000 })
            const result = await page.evaluate(() => window.result)
            console.log(JSON.stringify({ mode: gpu ? 'WebGPU' : 'WebGL', ...result, browserErrors: errors }))
            assert.equal(result.backend, gpu ? 'WebGPU' : 'WebGL', 'unexpected renderer backend/fallback')
            assert.deepEqual([...result.errors, ...errors], [], 'rendering errors')
            assert.equal(result.targets.length, 6, 'frame callbacks must actually run')
            assert.ok(result.targets.every(Boolean), 'caller render target was lost')
            assert.ok(result.subresources.every(Boolean), 'caller cube face or mip level was lost')
            assert.ok(result.clears.every(Boolean), 'caller clear color or alpha was changed')
            assert.ok(result.postRestoredTarget, 'post-processing changed the caller target')
            if (frames === '0')
              assert.ok(
                result.renders.every((count) => count === 0),
                'frames=0 rendered'
              )
            else {
              assert.ok(result.renders[0] > 0, 'candidate never rendered')
              if (frames === '1')
                assert.ok(
                  result.renders.slice(1).every((count) => count === 0),
                  'finite frames kept rendering'
                )
            }
            if (scenario !== 'default' && scenario !== 'mip') {
              assert.ok(
                result.pixel[0] < 5 && result.pixel[1] > 250 && result.pixel[2] < 5,
                'continuation/post-processing pixel is not green'
              )
            }
          } catch (error) {
            failures++
            console.error(`${gpu ? 'WebGPU' : 'WebGL'} ${component} ${scenario} frames=${frames}: ${error.message}`)
            if (errors.length) console.error(errors.join('\n'))
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
console.log(`${failures ? 'FAIL' : 'PASS'}: ${cases} render-target scenarios, ${failures} failures`)
process.exitCode = failures ? 1 : 0
