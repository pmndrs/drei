import { describe, expect, it } from 'vitest'

import {
  closestGazeHit,
  gazeClientToNdc,
  gazeClientToScreen,
  gazeRayBundle,
  gazeScreenToClient,
  getGazeViewport,
} from './GazePointer.pick'

describe('gazeRayBundle', () => {
  it('lays 7 rays as the centre plus one ring of six on the edge of the disc', () => {
    const bundle = gazeRayBundle(7)

    expect(bundle).toHaveLength(7)
    expect(bundle[0]).toEqual({ x: 0, y: 0 })
    for (const ray of bundle.slice(1)) expect(Math.hypot(ray.x, ray.y)).toBeCloseTo(1, 9)

    // evenly spread: 60 degrees between neighbours
    const angles = bundle.slice(1).map((ray) => Math.atan2(ray.y, ray.x))
    for (let i = 1; i < angles.length; i++) {
      const step = (((angles[i] - angles[i - 1]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      expect(step).toBeCloseTo(Math.PI / 3, 9)
    }
  })

  it('is the centre alone for one ray, and for anything below', () => {
    expect(gazeRayBundle(1)).toEqual([{ x: 0, y: 0 }])
    expect(gazeRayBundle(0)).toEqual([{ x: 0, y: 0 }])
    expect(gazeRayBundle(-3)).toEqual([{ x: 0, y: 0 }])
    expect(gazeRayBundle(NaN)).toEqual([{ x: 0, y: 0 }])
  })

  it('splits a larger bundle in two rings, a third of the rays at half the radius', () => {
    const bundle = gazeRayBundle(13)
    const radii = bundle.map((ray) => Math.round(Math.hypot(ray.x, ray.y) * 100) / 100)

    expect(bundle).toHaveLength(13)
    expect(radii.filter((radius) => radius === 0)).toHaveLength(1)
    expect(radii.filter((radius) => radius === 0.5)).toHaveLength(4)
    expect(radii.filter((radius) => radius === 1)).toHaveLength(8)
  })

  it('drops the fraction of a count that is not whole', () => {
    expect(gazeRayBundle(7.9)).toHaveLength(7)
  })
})

describe('getGazeViewport', () => {
  it('is the position of the window when the browser has no chrome (fullscreen)', () => {
    const view = { screenX: 0, screenY: 0, outerWidth: 1920, outerHeight: 1080, innerWidth: 1920, innerHeight: 1080 }

    expect(getGazeViewport(view)).toEqual({ x: 0, y: 0 })
  })

  it('puts the whole chrome height above the page', () => {
    // a window at (100, 50) with 87 pixels of tabs and toolbars
    const view = { screenX: 100, screenY: 50, outerWidth: 1200, outerHeight: 887, innerWidth: 1200, innerHeight: 800 }

    expect(getGazeViewport(view)).toEqual({ x: 100, y: 137 })
  })

  it('takes a wider window as framed by equal borders on the left, the right and the bottom', () => {
    // 8 pixel borders, 80 pixels of chrome above
    const view = { screenX: 10, screenY: 20, outerWidth: 1016, outerHeight: 888, innerWidth: 1000, innerHeight: 800 }

    expect(getGazeViewport(view)).toEqual({ x: 18, y: 100 })
  })

  it('adds the position of each frame the page is nested in', () => {
    const top = { screenX: 100, screenY: 50, outerWidth: 1200, outerHeight: 887, innerWidth: 1200, innerHeight: 800 }
    const middle = {
      ...top,
      innerWidth: 900,
      innerHeight: 700,
      parent: top,
      frameElement: { getBoundingClientRect: () => ({ left: 300, top: 40 }) },
    }
    const inner = {
      ...top,
      innerWidth: 400,
      innerHeight: 300,
      parent: middle,
      frameElement: { getBoundingClientRect: () => ({ left: 5, top: 6 }) },
    }

    expect(getGazeViewport(inner)).toEqual({ x: 100 + 300 + 5, y: 137 + 40 + 6 })
  })

  it('stops at a window that is its own parent', () => {
    const view: Parameters<typeof getGazeViewport>[0] = {
      screenX: 100,
      screenY: 50,
      outerWidth: 1200,
      outerHeight: 887,
      innerWidth: 1200,
      innerHeight: 800,
      frameElement: null,
    }
    view.parent = view

    expect(getGazeViewport(view)).toEqual({ x: 100, y: 137 })
  })
})

describe('gazeScreenToClient and gazeClientToScreen', () => {
  it('moves a screen point into the page, and back', () => {
    const viewport = { x: 100, y: 137 }

    expect(gazeScreenToClient({ x: 500, y: 400 }, viewport)).toEqual({ x: 400, y: 263 })
    expect(gazeClientToScreen({ x: 400, y: 263 }, viewport)).toEqual({ x: 500, y: 400 })
  })
})

describe('gazeClientToNdc', () => {
  const rect = { left: 200, top: 100, width: 800, height: 400 }

  it('maps the corners and the centre of the canvas, y up', () => {
    expect(gazeClientToNdc({ x: 600, y: 300 }, rect)).toEqual({ x: 0, y: 0 })
    expect(gazeClientToNdc({ x: 200, y: 100 }, rect)).toEqual({ x: -1, y: 1 })
    expect(gazeClientToNdc({ x: 1000, y: 500 }, rect)).toEqual({ x: 1, y: -1 })
    expect(gazeClientToNdc({ x: 400, y: 400 }, rect)).toEqual({ x: -0.5, y: -0.5 })
  })

  it('is null outside the canvas', () => {
    expect(gazeClientToNdc({ x: 199, y: 300 }, rect)).toBeNull()
    expect(gazeClientToNdc({ x: 1001, y: 300 }, rect)).toBeNull()
    expect(gazeClientToNdc({ x: 600, y: 99 }, rect)).toBeNull()
    expect(gazeClientToNdc({ x: 600, y: 501 }, rect)).toBeNull()
  })

  it('is null for a canvas without a size', () => {
    expect(gazeClientToNdc({ x: 200, y: 100 }, { left: 200, top: 100, width: 0, height: 0 })).toBeNull()
  })
})

describe('closestGazeHit', () => {
  it('is null when no ray hit anything', () => {
    expect(closestGazeHit([])).toBeNull()
  })

  it('elects what the centre ray hits, whatever the ring hits', () => {
    const hits = [
      { offset: 1, target: 'b', distance: 1, hit: 'b1' },
      { offset: 0, target: 'a', distance: 9, hit: 'a0' },
      { offset: 1, target: 'b', distance: 1, hit: 'b2' },
    ]

    expect(closestGazeHit(hits)).toEqual({ target: 'a', hit: 'a0' })
  })

  it('elects the hit of the inner ring over the outer ring when the centre misses', () => {
    const hits = [
      { offset: 1, target: 'b', distance: 1, hit: 'b1' },
      { offset: 0.5, target: 'a', distance: 9, hit: 'a1' },
    ]

    expect(closestGazeHit(hits)).toEqual({ target: 'a', hit: 'a1' })
  })

  it('breaks a tie between two targets of one ring by the number of rays that hit each', () => {
    const hits = [
      { offset: 1, target: 'a', distance: 1, hit: 'a1' },
      { offset: 1, target: 'b', distance: 5, hit: 'b1' },
      { offset: 1, target: 'b', distance: 5, hit: 'b2' },
    ]

    expect(closestGazeHit(hits)).toEqual({ target: 'b', hit: 'b1' })
  })

  it('breaks what is left of a tie by the distance to the camera', () => {
    const hits = [
      { offset: 1, target: 'a', distance: 5, hit: 'a1' },
      { offset: 1, target: 'b', distance: 2, hit: 'b1' },
    ]

    expect(closestGazeHit(hits)).toEqual({ target: 'b', hit: 'b1' })
  })
})
