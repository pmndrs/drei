import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for WebGPU testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium-webgl',
      use: {
        ...devices['Desktop Chrome'],
        // WebGL rendering (default)
      },
    },

    {
      name: 'chromium-webgpu',
      use: {
        ...devices['Desktop Chrome'],
        // Enable WebGPU flag
        launchOptions: {
          args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=vulkan'],
        },
      },
    },

    // Firefox and WebKit don't support WebGPU yet (as of Dec 2024)
    // Uncomment when they add support
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'yarn serve', // or 'npm run dev'
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
