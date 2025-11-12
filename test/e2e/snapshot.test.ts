import { request } from 'node:http'
import { test, expect, Page } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const host = 'http://localhost:5188/'

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

test('should match previous one', async ({ page }) => {
  await waitForServer()

  // ⏳ "r3f" event
  await page.goto(host)
  await waitForEvent(page, 'playright:r3f')

  // 📸 <canvas>
  const $canvas = page.locator('canvas[data-engine]')

  // 👁️ Screenshot with version-aware naming (e.g., should-match-previous-one-1-linux-159.png)
  await expect($canvas).toHaveScreenshot(`should-match-previous-one-1-linux-${THREE_VERSION}.png`)
})

test('snapshot filename should match current three.js version', () => {
  const snapshotDir = join(__dirname, 'snapshot.test.ts-snapshots')
  const expectedPattern = new RegExp(`should-match-previous-one-1-linux-${THREE_VERSION}\\.png$`)

  // Check if snapshot file exists with correct version
  const files = readdirSync(snapshotDir)
  const matchingFile = files.find((file) => expectedPattern.test(file))

  if (!matchingFile) {
    throw new Error(
      `Snapshot file with version ${THREE_VERSION} not found. ` +
        `Expected pattern: should-match-previous-one-1-linux-${THREE_VERSION}.png\n` +
        `Found files: ${files.join(', ')}\n` +
        `If you updated three.js version in package.json, run 'yarn test:update-snapshot' to generate a new snapshot.`
    )
  }
})
