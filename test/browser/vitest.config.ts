import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

// Install the test browser with `yarn playwright install chromium`, then run `yarn test:html`.
export default defineConfig({
  optimizeDeps: {
    include: [
      'three',
      'three/webgpu',
      '@react-three/fiber',
      'react',
      'react-dom/client',
      '@react-three/fiber/legacy',
      '@react-three/fiber/extension',
    ],
  },
  resolve: { alias: { '#three': 'three' } },
  test: {
    include: ['test/browser/Html.test.tsx'],
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright({
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
})
