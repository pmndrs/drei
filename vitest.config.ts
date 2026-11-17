import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests sit next to their module. `test/e2e` is Playwright and has its own runner.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
