/**
 * Platform Parity Tests
 *
 * Compares Legacy (WebGL) and WebGPU renders of the same stories
 * to ensure visual consistency across platforms.
 *
 * Stories opt-in to parity testing via the 'parity' tag:
 * ```tsx
 * export default {
 *   title: 'Staging/Clone',
 *   tags: ['parity'],
 * } satisfies Meta;
 * ```
 *
 * Run: yarn test:parity
 */
import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

//* Configuration ==============================

const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://localhost:6006';
const STORYBOOK_STATIC = path.resolve(__dirname, '../../storybook-static');
const OUTPUT_DIR = path.resolve(__dirname, '../../test-results/parity');

// Pixel comparison threshold (0-1, lower = stricter)
// 0.1 allows for anti-aliasing differences
const PIXEL_THRESHOLD = 0.1;

// Maximum allowed difference percentage before test fails
const MAX_DIFF_PERCENT = 5;

// Time to wait for scene to settle after navigation (ms)
const SETTLE_TIME = 1000;

// Fallback story list if tag discovery fails
const FALLBACK_STORIES = [
  'helpers-clone--clone-st',
  'controls-dragcontrols--drag-controls-story',
  'shapes-box--box-st',
];

//* Types ==============================

interface StoryEntry {
  id: string;
  title: string;
  name: string;
  tags?: string[];
}

interface StorybookIndex {
  v: number;
  entries: Record<string, StoryEntry>;
}

interface TestResult {
  storyId: string;
  diffPercent: number;
  passed: boolean;
  error?: string;
}

//* Story Discovery ==============================

/**
 * Discovers stories with the 'parity' tag from Storybook's index.json
 * Falls back to explicit list if discovery fails
 */
function discoverParityStories(): string[] {
  const indexPath = path.join(STORYBOOK_STATIC, 'index.json');

  try {
    if (!fs.existsSync(indexPath)) {
      console.log('⚠️  index.json not found, using fallback story list');
      return FALLBACK_STORIES;
    }

    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const index: StorybookIndex = JSON.parse(indexContent);

    const parityStories: string[] = [];

    for (const [id, entry] of Object.entries(index.entries)) {
      // Check if story has 'parity' tag and is not a docs page
      if (entry.tags?.includes('parity') && !id.endsWith('--docs')) {
        parityStories.push(id);
      }
    }

    if (parityStories.length === 0) {
      console.log('⚠️  No stories with "parity" tag found, using fallback list');
      return FALLBACK_STORIES;
    }

    console.log(`📋 Found ${parityStories.length} stories with "parity" tag`);
    return parityStories;
  } catch (error) {
    console.log('⚠️  Failed to parse index.json, using fallback story list');
    console.log(`   Error: ${error}`);
    return FALLBACK_STORIES;
  }
}

//* Test Utilities ==============================

/**
 * Ensures the output directory exists
 */
function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Saves a PNG buffer to a file
 */
function savePng(filename: string, buffer: Buffer): void {
  ensureOutputDir();
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
}

/**
 * Saves a PNG object to a file
 */
function savePngObject(filename: string, png: PNG): void {
  ensureOutputDir();
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), PNG.sync.write(png));
}

/**
 * Converts a story ID to a safe filename
 */
function toFilename(storyId: string): string {
  return storyId.replace(/[^a-zA-Z0-9-]/g, '-');
}

//* Test Suite ==============================

test('Platform Parity - Legacy vs WebGPU comparison', async ({ page }) => {
  const parityStories = discoverParityStories();
  const results: TestResult[] = [];

  console.log(`\n🔍 Testing ${parityStories.length} stories for platform parity:\n`);
  parityStories.forEach((id) => console.log(`   - ${id}`));
  console.log('');

  for (const storyId of parityStories) {
    console.log(`\n📸 Testing: ${storyId}`);
    const safeId = toFilename(storyId);

    try {
      //* Capture Legacy render --
      const legacyUrl = `${STORYBOOK_URL}/iframe.html?id=${storyId}&globals=renderer:legacy&viewMode=story`;
      await page.goto(legacyUrl);

      // Wait for canvas to appear
      const canvas = page.locator('canvas[data-engine]');
      await canvas.waitFor({ state: 'visible', timeout: 30000 });

      // Wait for scene to settle (animations to freeze, assets to load)
      await page.waitForTimeout(SETTLE_TIME);

      const legacyBuffer = await canvas.screenshot();
      console.log(`   ✓ Legacy captured`);

      //* Capture WebGPU render --
      const webgpuUrl = `${STORYBOOK_URL}/iframe.html?id=${storyId}&globals=renderer:webgpu&viewMode=story`;
      await page.goto(webgpuUrl);

      await canvas.waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForTimeout(SETTLE_TIME);

      const webgpuBuffer = await canvas.screenshot();
      console.log(`   ✓ WebGPU captured`);

      //* Compare images --
      const legacyPng = PNG.sync.read(legacyBuffer);
      const webgpuPng = PNG.sync.read(webgpuBuffer);

      // Ensure same dimensions
      if (legacyPng.width !== webgpuPng.width || legacyPng.height !== webgpuPng.height) {
        console.log(`   ❌ Dimension mismatch: Legacy ${legacyPng.width}x${legacyPng.height} vs WebGPU ${webgpuPng.width}x${webgpuPng.height}`);
        savePng(`${safeId}-legacy.png`, legacyBuffer);
        savePng(`${safeId}-webgpu.png`, webgpuBuffer);
        results.push({
          storyId,
          diffPercent: 100,
          passed: false,
          error: `Dimension mismatch`,
        });
        continue;
      }

      const { width, height } = legacyPng;
      const diff = new PNG({ width, height });

      const mismatchedPixels = pixelmatch(
        legacyPng.data,
        webgpuPng.data,
        diff.data,
        width,
        height,
        { threshold: PIXEL_THRESHOLD }
      );

      const totalPixels = width * height;
      const diffPercent = (mismatchedPixels / totalPixels) * 100;
      const passed = diffPercent <= MAX_DIFF_PERCENT;

      results.push({ storyId, diffPercent, passed });

      if (passed) {
        console.log(`   ✅ PASS: ${diffPercent.toFixed(2)}% difference (threshold: ${MAX_DIFF_PERCENT}%)`);
      } else {
        console.log(`   ❌ FAIL: ${diffPercent.toFixed(2)}% difference (threshold: ${MAX_DIFF_PERCENT}%)`);

        // Save images for debugging
        savePng(`${safeId}-legacy.png`, legacyBuffer);
        savePng(`${safeId}-webgpu.png`, webgpuBuffer);
        savePngObject(`${safeId}-diff.png`, diff);

        console.log(`   📁 Saved diff images to test-results/parity/`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
      results.push({
        storyId,
        diffPercent: 100,
        passed: false,
        error: String(error),
      });
    }
  }

  //* Summary --
  console.log('\n' + '='.repeat(60));
  console.log('📊 Parity Test Summary');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`\n✅ Passed: ${passed.length}`);
  passed.forEach((r) => console.log(`   - ${r.storyId}: ${r.diffPercent.toFixed(2)}%`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach((r) => {
      const reason = r.error || `${r.diffPercent.toFixed(2)}% diff`;
      console.log(`   - ${r.storyId}: ${reason}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Assert all tests passed
  expect(failed.length, `${failed.length} stories exceeded ${MAX_DIFF_PERCENT}% difference threshold`).toBe(0);
});
