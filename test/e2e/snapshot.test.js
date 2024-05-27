const http = require('http')
const puppeteer = require('puppeteer')

const { toMatchImageSnapshot } = require('jest-image-snapshot')
expect.extend({ toMatchImageSnapshot })

const host = 'http://localhost:5188/'

const TIMEOUT = 10000

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
    console.log('server ok')

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    console.log('executablePath', executablePath)

    const args = ['--enable-gpu']

    browser = await puppeteer.launch({
      executablePath,
      args,
    })
    console.log('browser ok')

    page = await browser.newPage()
    console.log('page ok')

    page.on('console', (message) => console.log(`Page log: ${message.text()}`))
  }, TIMEOUT)

  it(
    'should match previous one',
    async () => {
      // ⏳ "r3f" event
      await page.goto(host)
      console.log('goto ok')

      await waitForEvent(page, 'puppeteer:r3f')
      console.log('event ok')

      // 📸 <canvas>
      const $canvas = await page.$('canvas[data-engine]')
      const image = await $canvas.screenshot()

      // compare
      expect(image).toMatchImageSnapshot({
        // failureThreshold: 1,
        // failureThresholdType: 'percent',
      })
    },
    TIMEOUT
  )

  afterAll(async () => {
    await browser?.close()
  })
})
