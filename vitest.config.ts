import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Vitest configuration for canary tests
 *
 * Purpose: Validate the build output is functional (smoke test)
 * - Entry points can be imported without errors
 * - Key exports exist and are accessible
 * - TypeScript declarations are generated
 *
 * Note: Uses .mjs for reliable ESM execution without TS transformation
 */
export default defineConfig({
  test: {
    include: ['test/canary/**/*.test.{ts,mjs}'],
    environment: 'node',
    globals: true,

    // Canary tests run against dist/, so build must complete first
    // Run with: yarn build && yarn test:canary
  },

  resolve: {
    alias: {
      // Point to dist for testing built output
      '@drei/dist': path.resolve(__dirname, 'dist'),
    },
  },
})
