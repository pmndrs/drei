import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for canary tests
 * 
 * These tests verify the built package works correctly:
 * - Entry point exports are accessible
 * - Bundle structure is correct
 * - No import errors from dist/
 */
export default defineConfig({
  test: {
    include: ['test/canary/**/*.test.ts'],
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
});

