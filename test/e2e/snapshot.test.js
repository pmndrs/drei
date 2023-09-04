const http = require('http')
const puppeteer = require('puppeteer')

const { toMatchImageSnapshot } = require('jest-image-snapshot')
expect.extend({ toMatchImageSnapshot })

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

describe('snapshot', () => {
  let browser
  let page
  beforeAll(async () => {
    await waitForServer()
    browser = await puppeteer.launch({ headless: 'new' })
    page = await browser.newPage()
  }, 30000)

  it('should match previous one', async () => {
    // ⏳ "r3f" event
    await page.goto(host)
    await waitForEvent(page, 'puppeteer:r3f')

    // 📸 <canvas>
    const $canvas = await page.$('canvas[data-engine]')
    const image = await $canvas.screenshot()

    // compare
    expect(image).toMatchImageSnapshot({})
  }, 30000)

  afterAll(async () => {
    await browser?.close()
  })
})
