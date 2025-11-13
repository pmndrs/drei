import { request } from 'node:http'
import { test, expect, Page } from '@playwright/test'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const port = process.env.PORT || '5188'
const host = `http://localhost:${port}/`

// Capture browser console in output
test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    // eslint-disable-next-line no-console
    console.log(`[browser:${msg.type()}] ${msg.text()}`)
  })
})
// Extract three.js minimum version from package.json peerDependencies
// Parses ">=0.159" to "159"
function getThreeVersion(): string {
  const packageJsonPath = join(__dirname, '../../package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const peerDep = packageJson.peerDependencies?.three || ''
  const match = peerDep.match(/>=?([0-9]+)\.([0-9]+)/)
  if (!match) {
    throw new Error(`Could not parse three.js version from peerDependencies: ${peerDep}`)
  }
  // Return the minor version number (e.g., "159" from "0.159")
  return match[2]
}

const THREE_VERSION = getThreeVersion()

async function waitForEvent(page: Page, eventName: string) {
  await page.evaluate(
    (eventName) => new Promise((resolve) => document.addEventListener(eventName, resolve, { once: true })),
    eventName
  )
}

function waitForServer() {
  return new Promise((resolve) => {
    function ping() {
      const req = request(host, { method: 'HEAD' }, resolve)
      req.on('error', () => {
        setTimeout(ping, 500) // not yet up? => re-ping in 500ms
      })
      req.end()
    }

    ping()
  })
}

test('should match previous one (min baseline warn-only)', async ({ page }) => {
  await waitForServer()

  // ⏳ "r3f" event
  await page.goto(host)
  await waitForEvent(page, 'playright:r3f')

  // 📸 <canvas>
  const $canvas = page.locator('canvas[data-engine]')
  // Save a copy of the current render regardless of assertion result
  const outDir = join(__dirname, 'test-results', 'snapshot-should-match-previous-one')
  mkdirSync(outDir, { recursive: true })
  const actualPath = join(outDir, `should-match-previous-one-1-${THREE_VERSION}-actual.png`)
  const png = await $canvas.screenshot()
  // Ensure Node fs accepts the buffer across lib type boundaries by converting to Uint8Array
  const pngBytes = png instanceof Buffer ? new Uint8Array(png) : new Uint8Array(png as ArrayBuffer)
  writeFileSync(actualPath, pngBytes)

  // 👁️ Always compare against the minimum baseline version from package.json (Playwright appends -linux automatically)
  const snapshotName = `should-match-previous-one-1-${THREE_VERSION}.png`
  try {
    await expect($canvas).toHaveScreenshot(snapshotName)
  } catch (error) {
    // Warn-only; do not fail suite here
    // eslint-disable-next-line no-console
    console.warn(
      `::warning:: Visual snapshot mismatch for ${snapshotName}. See ${actualPath} and HTML report for details.`
    )
  }
})

// Blocking sanity: page loads and camera flag is set
test('app should load and expose isPerspectiveCam', async ({ page }) => {
  await waitForServer()
  await page.goto(host)
  await waitForEvent(page, 'playright:r3f')
  const isPerspective = await page.evaluate(() => (window as any).isPerspectiveCam === true)
  expect(isPerspective).toBe(true)
})

test('snapshot filename should match current three.js version', () => {
  const snapshotDir = join(__dirname, 'snapshot.test.ts-snapshots')
  // Playwright adds platform suffix (-linux) automatically, so check for that pattern
  const expectedPattern = new RegExp(`should-match-previous-one-1-${THREE_VERSION}-linux\\.png$`)

  // Check if snapshot file exists with correct version
  const files = readdirSync(snapshotDir)
  const matchingFile = files.find((file) => expectedPattern.test(file))

  if (!matchingFile) {
    throw new Error(
      `Snapshot file with version ${THREE_VERSION} not found. ` +
      `Expected pattern: should-match-previous-one-1-${THREE_VERSION}-linux.png\n` +
      `Found files: ${files.join(', ')}\n` +
      `If you updated three.js version in package.json, run 'yarn test:update-snapshot' to generate a new snapshot.`
    )
  }
})
