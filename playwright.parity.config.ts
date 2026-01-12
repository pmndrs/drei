import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Platform Parity Testing
 *
 * Compares Legacy (WebGL) vs WebGPU renders of the same stories
 * to ensure visual consistency across platforms.
 *
 * Run: yarn test:parity
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test/parity',

  // Run tests sequentially (we're comparing in a single test)
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 1 : 0,

  // Single worker for consistent results
  workers: 1,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Timeout for each test (parity tests can take a while with many stories)
  timeout: 120_000,

  use: {
    // Base URL for Storybook
    baseURL: 'http://localhost:6006',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Viewport size for consistent captures
    viewport: { width: 800, height: 600 },
  },

  // Configure browser - Chrome only (WebGPU support)
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable WebGPU flags for WebGPU renderer testing
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            '--enable-features=Vulkan',
            '--use-angle=vulkan',
          ],
        },
      },
    },
  ],

  // Run built storybook before tests
  webServer: {
    command: 'npx serve storybook-static -p 6006',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  // Output directory for test artifacts
  outputDir: 'test-results/parity-artifacts',
});


