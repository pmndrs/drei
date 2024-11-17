import { request } from 'node:http'
import { test, expect, Page } from '@playwright/test'

const host = 'http://localhost:5188/'

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

  // 👁️
  await expect($canvas).toHaveScreenshot()
})
