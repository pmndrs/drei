const puppeteer = require('puppeteer')

const { toMatchImageSnapshot } = require('jest-image-snapshot')
expect.extend({ toMatchImageSnapshot })

async function waitForEvent(page, eventName) {
  await page.evaluate(
    (eventName) => new Promise((resolve) => document.addEventListener(eventName, resolve, { once: true })),
    eventName
  )
}

describe('snapshot', () => {
  let browser
  let page
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' })
    page = await browser.newPage()
  })

  it('should match previous one', async () => {
    // ⏳ "r3f" event
    await page.goto('http://localhost:5188')
    await waitForEvent(page, 'puppeteer:r3f')

    // 📸 <canvas>
    const $canvas = await page.$('canvas[data-engine]')
    const image = await $canvas.screenshot()

    // compare
    expect(image).toMatchImageSnapshot({})
  }, 30000)

  afterAll(async () => {
    await browser.close()
  })
})
