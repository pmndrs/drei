const http = require('http')
const { test, expect } = require('@playwright/test')

const host = 'http://localhost:5188/'

async function waitForEvent(page, eventName) {
  await page.evaluate(
    (eventName) => new Promise((resolve) => document.addEventListener(eventName, resolve, { once: true })),
    eventName
  )
}

function waitForServer() {
  return new Promise((resolve) => {
    function ping() {
      const request = http.request(host, { method: 'HEAD' }, resolve)
      request.on('error', () => {
        setTimeout(ping, 500) // not yet up? => re-ping in 500ms
      })
      request.end()
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
