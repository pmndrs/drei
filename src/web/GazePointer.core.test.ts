import { describe, expect, it } from 'vitest'
import {
  createGazePointerCore,
  GazePointerCoreDefaults,
  resolveGazeTolerance,
  type GazePointerCore,
  type GazePointerCoreOptions,
  type GazePointerEvent,
  type GazePointerFrame,
  type GazePointerPick,
} from './GazePointer.core'
import { gazeDegreesToPixels, gazeToScreen, type GazeDetection } from './GazePointer.model'
import { synthesizeGaze } from './GazePointer.model.test-utils'

//
// Fixtures: a 1920 x 1080 screen, the priors as calibration, and two neighbouring rectangles in the middle of it.
//

const screen = { width: 1920, height: 1080 }

type Rectangle = { name: string; left: number; top: number; right: number; bottom: number }

/** Two rectangles of 300 pixels sharing the edge at x = 960. */
const a: Rectangle = { name: 'a', left: 660, top: 390, right: 960, bottom: 690 }
const b: Rectangle = { name: 'b', left: 960, top: 390, right: 1260, bottom: 690 }

const centerOf = (rectangle: Rectangle) => ({
  x: (rectangle.left + rectangle.right) / 2,
  y: (rectangle.top + rectangle.bottom) / 2,
})

/** A point of the screen plane that is not on the screen: looking there is looking away, with open eyes. */
const away = { x: -500, y: 540 }

/** Distance from a point to a rectangle, zero inside it. */
function distanceTo(rectangle: Rectangle, point: { x: number; y: number }) {
  const dx = Math.max(rectangle.left - point.x, 0, point.x - rectangle.right)
  const dy = Math.max(rectangle.top - point.y, 0, point.y - rectangle.bottom)
  return Math.hypot(dx, dy)
}

/** What the fake pick function hands back with the events: where it was asked, and how far the target was. */
type Hit = { point: { x: number; y: number }; distance: number }

/**
 * A fake pick function over a layout of rectangles: the rectangle touched by the disc that is closest to its centre.
 * Every call is recorded in `calls`.
 */
function createPick(layout: Rectangle[]) {
  const calls: { point: { x: number; y: number }; radius: number; target: Rectangle | null }[] = []
  const pick: GazePointerPick<Rectangle, Hit> = (point, radius) => {
    let best: { target: Rectangle; hit: Hit } | null = null
    for (const rectangle of layout) {
      const distance = distanceTo(rectangle, point)
      if (distance > radius) continue
      if (best === null || distance < best.hit.distance) best = { target: rectangle, hit: { point, distance } }
    }
    calls.push({ point, radius, target: best === null ? null : best.target })
    return best
  }
  return { pick, calls }
}

/** What the user does at a given time: look at a point of the screen plane, close the eyes, or leave the camera. */
type Gaze = { x: number; y: number } | 'blink' | 'gone'

/** The detection of a face looking at `target`, with gaussian noise of `sigma` degrees on the eye angles. */
function look(target: { x: number; y: number }, sigma = 0, seed = 1): GazeDetection {
  // A blendshape score of 1 stands for 50 degrees of yaw: see `GAZE_BLENDSHAPES_RANGE`.
  return synthesizeGaze({ target, screen, noise: { blendshapes: sigma / 50, seed } })
}

/** The detection of a face with both eyes closed, the gaze signal still pointing at `target`. */
function blink(target: { x: number; y: number }): GazeDetection {
  const detection = look(target)
  return {
    ...detection,
    faceBlendshapes: [
      {
        categories: detection.faceBlendshapes![0].categories.map((category) =>
          category.categoryName === 'eyeBlinkLeft' || category.categoryName === 'eyeBlinkRight'
            ? { ...category, score: 0.9 }
            : category
        ),
      },
    ],
  }
}

/** The outcome of a frame, with its time and the raw gaze point of the model before the filter (`null` for none). */
type Sample = GazePointerFrame<Rectangle, Hit> & { time: number; raw: { x: number; y: number } | null }

/**
 * Drives a core at `rate` frames per second from `from` to `to` milliseconds (`to` excluded), the user doing
 * `gaze(time)`, and returns the outcome of every frame.
 */
function run(
  core: GazePointerCore<Rectangle, Hit>,
  pick: GazePointerPick<Rectangle, Hit>,
  {
    gaze,
    from = 0,
    to,
    rate = 30,
    sigma = 0,
    seed = 1,
  }: { gaze: (time: number) => Gaze; from?: number; to: number; rate?: number; sigma?: number; seed?: number }
): Sample[] {
  const samples: Sample[] = []
  const first = Math.ceil((from * rate) / 1000)
  for (let i = first; (i * 1000) / rate < to; i++) {
    const time = (i * 1000) / rate
    const doing = gaze(time)
    let detection: GazeDetection | undefined
    if (doing === 'gone') detection = undefined
    else if (doing === 'blink') detection = blink(centerOf(a))
    else detection = look(doing, sigma, seed * 100003 + i)
    const raw = detection ? gazeToScreen(detection, undefined, { screen }) : null
    samples.push({ time, raw, ...core.update(detection, time, pick) })
  }
  return samples
}

function createCore(options: GazePointerCoreOptions = {}) {
  return createGazePointerCore<Rectangle, Hit>({ screen, ...options })
}

/** The events of a run, in order, as `type name` strings: easy to read in an assertion. */
const eventsOf = (samples: { events: GazePointerEvent<Rectangle, Hit>[] }[]) =>
  samples.flatMap((sample) => sample.events).map((event) => `${event.type} ${event.target.name}`)

/** The same, without the moves. */
const transitionsOf = (samples: { events: GazePointerEvent<Rectangle, Hit>[] }[]) =>
  eventsOf(samples).filter((event) => !event.startsWith('move'))

/** The time of the first frame that emitted `event` (`type name`), or `undefined`. */
const timeOf = (samples: Sample[], event: string) => samples.find((sample) => eventsOf([sample]).includes(event))?.time

describe('the gaze point and the pick', () => {
  it('asks the pick function for the candidate under a disc around the gaze point', () => {
    const core = createCore({ tolerance: 3 })
    const { pick, calls } = createPick([a, b])
    const detection = look(centerOf(a))

    const frame = core.update(detection, 0, pick)

    // the point is the one of the gaze model, the radius the tolerance seen from the distance of the eyes
    const expected = gazeToScreen(detection, undefined, { screen })!
    expect(frame.point!.x).toBeCloseTo(810, 3)
    expect(frame.point!.y).toBeCloseTo(540, 3)
    expect(frame.radius).toBeCloseTo(gazeDegreesToPixels(3, expected.distance, undefined, { screen }), 6)
    // about 55 cm away, 3 degrees are about 3 cm, 120 pixels at 40 pixels per centimetre
    expect(frame.radius).toBeGreaterThan(100)
    expect(frame.radius).toBeLessThan(140)

    expect(calls).toHaveLength(1)
    expect(calls[0].point).toEqual(frame.point)
    expect(calls[0].radius).toBe(frame.radius)
    expect(calls[0].target).toBe(a)
  })

  it('filters the gaze point: a noisy fixation gives a steadier point than the raw signal', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const center = centerOf(a)

    const samples = run(core, pick, { gaze: () => center, to: 3000, sigma: 1 })
    const settled = samples.filter((sample) => sample.time >= 1000)

    const raw = settled.map((sample) => sample.raw!)
    const spread = (points: { x: number; y: number }[]) =>
      Math.sqrt(points.reduce((sum, p) => sum + (p.x - center.x) ** 2 + (p.y - center.y) ** 2, 0) / points.length)

    expect(spread(raw)).toBeGreaterThan(30) // one degree of noise is about 40 pixels
    expect(spread(settled.map((sample) => sample.point!))).toBeLessThan(spread(raw) / 2)
  })
})

describe('target election', () => {
  it('elects the target the user keeps looking at, then moves on it every frame', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: () => centerOf(a), to: 1000 })

    // not on the first frame: a candidate has to hold the majority of a window that has started to fill
    expect(samples[0].target).toBeNull()
    expect(samples[0].events).toEqual([])

    const entered = timeOf(samples, 'enter a')!
    expect(entered).toBeGreaterThanOrEqual(90)
    expect(entered).toBeLessThanOrEqual(210)

    // one enter, then one move per frame, the first one in the frame of the enter
    const held = samples.filter((sample) => sample.time >= entered)
    expect(eventsOf(held)).toEqual(['enter a', ...held.map(() => 'move a')])
    expect(held.every((sample) => sample.target === a)).toBe(true)
    expect(core.target).toBe(a)
  })

  it('hands back the latest hit of the pick function with the events', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: () => centerOf(a), to: 500 })

    const last = samples[samples.length - 1]
    expect(last.events).toHaveLength(1)
    expect(last.events[0].type).toBe('move')
    expect(last.events[0].target).toBe(a)
    expect(last.events[0].hit).toEqual({ point: last.point, distance: 0 })
  })

  it('changes target when the user looks at another one: leave, then enter, in the same frame', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: (time) => centerOf(time < 1000 ? a : b), to: 2000 })

    expect(transitionsOf(samples)).toEqual(['enter a', 'leave a', 'enter b'])

    const changed = samples.find((sample) => eventsOf([sample]).includes('enter b'))!
    expect(eventsOf([changed])).toEqual(['leave a', 'enter b', 'move b'])
    // the challenger needs the majority of a 200 ms window: about 100 ms, plus the frame the filter takes to
    // confirm the saccade
    expect(changed.time).toBeGreaterThanOrEqual(1090)
    expect(changed.time).toBeLessThanOrEqual(1250)
    expect(core.target).toBe(b)
  })

  it('keeps the target when a challenger gets only a minority of the window', () => {
    const core = createCore({ filter: { timeConstant: 1 } }) // an almost raw point, so the glance reaches the pick
    const { pick, calls } = createPick([a, b])

    // a glance at b of 70 ms: two frames out of the six of the window
    const samples = run(core, pick, {
      gaze: (time) => centerOf(time >= 1000 && time < 1070 ? b : a),
      to: 2000,
    })

    expect(calls.some((call) => call.target === b)).toBe(true)
    expect(transitionsOf(samples)).toEqual(['enter a'])
  })

  it('releases the target when the user looks at an empty part of the screen: "no candidate" votes too', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const empty = { x: 300, y: 200 }

    const samples = run(core, pick, { gaze: (time) => (time < 1000 ? centerOf(a) : empty), to: 2000 })

    expect(transitionsOf(samples)).toEqual(['enter a', 'leave a'])
    const left = timeOf(samples, 'leave a')!
    expect(left).toBeGreaterThanOrEqual(1090)
    expect(left).toBeLessThanOrEqual(1250)

    // the gaze is still on the screen: there is a point, and nothing under it
    const last = samples[samples.length - 1]
    expect(last.point!.x).toBeCloseTo(empty.x, 0)
    expect(last.target).toBeNull()
    expect(last.events).toEqual([])
  })

  it('keeps the target when the gaze crosses an empty part of the screen for a minority of the window', () => {
    const core = createCore({ filter: { timeConstant: 1 } })
    const { pick, calls } = createPick([a, b])
    const empty = { x: 300, y: 200 }

    const samples = run(core, pick, {
      gaze: (time) => (time >= 1000 && time < 1070 ? empty : centerOf(a)),
      to: 2000,
    })

    expect(calls.some((call) => call.target === null)).toBe(true)
    expect(transitionsOf(samples)).toEqual(['enter a'])
  })

  it('does not flicker between two neighbouring targets under a noisy gaze', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const core = createCore()
      const { pick } = createPick([a, b])

      // one second on the centre of a, then ten seconds 40 pixels from the edge it shares with b, with one degree
      // of noise, which is about 40 pixels
      const samples = run(core, pick, {
        gaze: (time) => (time < 1000 ? centerOf(a) : { x: 920, y: 540 }),
        to: 11000,
        sigma: 1,
        seed,
      })

      // the raw gaze is over b in many frames...
      const overB = samples.filter((sample) => sample.raw!.x > b.left).length
      expect(overB).toBeGreaterThan(30)
      // ...and the elected target never changes
      expect(transitionsOf(samples)).toEqual(['enter a'])
    }
  })

  it('does not follow a candidate that flips for a frame or two, even with an almost raw point', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const core = createCore({ filter: { timeConstant: 1 } })
      const { pick, calls } = createPick([a, b])

      // the vote alone: ten seconds 60 pixels from the edge, the filter doing next to nothing
      const samples = run(core, pick, { gaze: () => ({ x: 900, y: 540 }), to: 10000, sigma: 1, seed })

      const flips = calls.filter((call) => call.target === b).length
      expect(flips).toBeGreaterThan(10)
      expect(transitionsOf(samples)).toEqual(['enter a'])
    }
  })

  it('releases the target when the user looks away from the screen, and has no gaze point then', () => {
    const core = createCore()
    const { pick, calls } = createPick([a, b])

    const before = run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    const picks = calls.length
    const after = run(core, pick, { gaze: () => away, from: 1000, to: 2000 })

    expect(transitionsOf(before)).toEqual(['enter a'])
    expect(transitionsOf(after)).toEqual(['leave a'])

    // no point as soon as the gaze is off the screen, so nothing to pick and no move
    expect(after.every((sample) => sample.point === null && sample.radius === 0)).toBe(true)
    expect(calls).toHaveLength(picks)
    expect(eventsOf(after)).toEqual(['leave a'])

    // looking away is not a blink: the release comes from the vote, in about half a window, not from the grace
    const left = timeOf(after, 'leave a')!
    expect(left).toBeGreaterThanOrEqual(1090)
    expect(left).toBeLessThanOrEqual(1210)
    expect(after[after.length - 1].target).toBeNull()
    expect(core.target).toBeNull()
    expect(core.point).toBeNull()
  })

  it('never emits two enters without a leave between them', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const places = [centerOf(a), centerOf(b), { x: 300, y: 200 }, away, centerOf(b), centerOf(a)]

    // a new place every 400 ms, with noise
    const samples = run(core, pick, {
      gaze: (time) => places[Math.floor(time / 400) % places.length],
      to: 12000,
      sigma: 1,
    })

    const transitions = transitionsOf(samples)
    expect(transitions.length).toBeGreaterThan(20)
    transitions.forEach((transition, index) => {
      const [type, name] = transition.split(' ')
      const previous = transitions[index - 1]
      if (type === 'enter') expect(previous === undefined || previous.startsWith('leave')).toBe(true)
      else expect(previous).toBe(`enter ${name}`)
    })
  })

  it('behaves the same at 30 and at 60 frames per second', () => {
    const scenario = (time: number): Gaze => {
      if (time < 1000) return centerOf(a)
      if (time < 2000) return centerOf(b)
      return away
    }

    const times = [30, 60].map((rate) => {
      const core = createCore()
      const { pick } = createPick([a, b])
      const samples = run(core, pick, { gaze: scenario, to: 3000, rate, sigma: 0.5 })

      expect(transitionsOf(samples)).toEqual(['enter a', 'leave a', 'enter b', 'leave b'])
      return ['enter a', 'enter b', 'leave b'].map((event) => timeOf(samples, event)!)
    })

    // the same transitions at the same times, within two frames of the slower rate
    times[0].forEach((time, index) => expect(Math.abs(time - times[1][index])).toBeLessThanOrEqual(67))
  })

  it('measures the vote window in milliseconds: a longer window takes longer to change target', () => {
    const changedAt = (voteWindow: number) => {
      const core = createCore({ voteWindow })
      const { pick } = createPick([a, b])
      const samples = run(core, pick, { gaze: (time) => centerOf(time < 1000 ? a : b), to: 3000, rate: 60 })
      return timeOf(samples, 'enter b')! - 1000
    }

    const short = changedAt(200)
    const long = changedAt(600)
    // half a window each, so 200 ms apart
    expect(long - short).toBeGreaterThanOrEqual(180)
    expect(long - short).toBeLessThanOrEqual(220)
  })
})

describe('frames without signal', () => {
  /** Looks at the centre of a, except between `from` and `to` where the user does `doing`. */
  const interrupted = (doing: Gaze, from: number, to: number) => (time: number) =>
    time >= from && time < to ? doing : centerOf(a)

  it('keeps the target through a blink shorter than the grace delay', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    // a blink of 200 ms, under the 300 ms of the default grace
    const samples = run(core, pick, { gaze: interrupted('blink', 1000, 1200), to: 2000 })

    expect(transitionsOf(samples)).toEqual(['enter a'])

    // during the blink: no gaze point, the target frozen, nothing emitted
    const during = samples.filter((sample) => sample.time >= 1000 && sample.time < 1200)
    expect(during.length).toBeGreaterThanOrEqual(5)
    for (const sample of during) {
      expect(sample.point).toBeNull()
      expect(sample.radius).toBe(0)
      expect(sample.target).toBe(a)
      expect(sample.events).toEqual([])
    }

    // the moves resume with the first frame after it
    const after = samples.find((sample) => sample.time >= 1200)!
    expect(eventsOf([after])).toEqual(['move a'])
  })

  it('does not ask the pick function while the eyes are closed', () => {
    const core = createCore()
    const { pick, calls } = createPick([a, b])

    run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    const picks = calls.length
    run(core, pick, { gaze: () => 'blink', from: 1000, to: 1200 })

    expect(calls).toHaveLength(picks)
  })

  it('releases the target when the eyes stay closed beyond the grace delay', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: (time) => (time < 1000 ? centerOf(a) : 'blink'), to: 2000 })

    expect(transitionsOf(samples)).toEqual(['enter a', 'leave a'])
    // the last frame with signal is the one before 1000 ms: the grace of 300 ms ends about 1270 ms
    const left = timeOf(samples, 'leave a')!
    expect(left).toBeGreaterThanOrEqual(1250)
    expect(left).toBeLessThanOrEqual(1310)

    const last = samples[samples.length - 1]
    expect(last.point).toBeNull()
    expect(last.target).toBeNull()
    expect(core.target).toBeNull()
  })

  it('releases the target when the face is lost beyond the grace delay, and keeps it through a short loss', () => {
    for (const lost of ['gone', 'no face', 'no matrix'] as const) {
      const core = createCore()
      const { pick } = createPick([a, b])
      const detectionAt = (time: number): GazeDetection | undefined => {
        const out = (time >= 1000 && time < 1150) || time >= 2000
        if (!out) return look(centerOf(a))
        if (lost === 'gone') return undefined
        // what MediaPipe returns without a face, and a detection the gaze model can do nothing with
        if (lost === 'no face') return { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] }
        return { ...look(centerOf(a)), facialTransformationMatrixes: [] }
      }

      const events: string[] = []
      let leftAt: number | undefined
      for (let i = 0; i < 90; i++) {
        const time = (i * 1000) / 30
        const frame = core.update(detectionAt(time), time, pick)
        events.push(...eventsOf([frame]))
        if (leftAt === undefined && eventsOf([frame]).includes('leave a')) leftAt = time
      }

      // the loss of 150 ms at 1000 ms went unnoticed, the one that started at 2000 ms released the target
      expect(events.filter((event) => !event.startsWith('move'))).toEqual(['enter a', 'leave a'])
      expect(leftAt).toBeGreaterThanOrEqual(2250)
      expect(leftAt).toBeLessThanOrEqual(2310)
      expect(core.point).toBeNull()
    }
  })

  it('measures the grace delay in milliseconds, whatever the frame rate', () => {
    const leftAt = (rate: number) => {
      const core = createCore({ blinkGrace: 500 })
      const { pick } = createPick([a, b])
      const samples = run(core, pick, { gaze: (time) => (time < 1000 ? centerOf(a) : 'blink'), to: 2000, rate })
      return timeOf(samples, 'leave a')!
    }

    for (const rate of [30, 60]) {
      expect(leftAt(rate)).toBeGreaterThanOrEqual(1450)
      expect(leftAt(rate)).toBeLessThanOrEqual(1510)
    }
  })

  it('releases the target on the first frame without signal when the grace delay is 0', () => {
    const core = createCore({ blinkGrace: 0 })
    const { pick } = createPick([a, b])

    const before = run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    const frame = core.update(blink(centerOf(a)), 1000, pick)

    expect(transitionsOf(before)).toEqual(['enter a'])
    expect(eventsOf([frame])).toEqual(['leave a'])
    expect(frame.target).toBeNull()
    expect(frame.point).toBeNull()
  })

  it('does not count the frames without signal as votes', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    // The eyes close, and reopen on b for one frame in three. Were the closed frames votes for "no candidate", or
    // for the target, b would never get its majority; as they are not, b wins with the few frames that vote.
    const samples = run(core, pick, {
      gaze: (time) => {
        if (time < 1000) return centerOf(a)
        return Math.round(time / (1000 / 30)) % 3 === 0 ? centerOf(b) : 'blink'
      },
      to: 2000,
    })

    expect(transitionsOf(samples)).toEqual(['enter a', 'leave a', 'enter b'])
  })

  it('tells a blink from looking away: one eye closed, or eyes half closed, is still a signal', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const wink = (target: { x: number; y: number }): GazeDetection => {
      const detection = blink(target)
      return {
        ...detection,
        faceBlendshapes: [
          {
            categories: detection.faceBlendshapes![0].categories.map((category) =>
              category.categoryName === 'eyeBlinkRight' ? { ...category, score: 0.2 } : category
            ),
          },
        ],
      }
    }

    run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    const frame = core.update(wink(centerOf(a)), 1000, pick)

    expect(frame.point).not.toBeNull()
    expect(eventsOf([frame])).toEqual(['move a'])
  })
})

describe('tolerance', () => {
  /** The tolerance a core applies, in degrees, read back from the radius of its disc. */
  const toleranceOf = (options: GazePointerCoreOptions) => {
    const detection = look(centerOf(a))
    const { pick } = createPick([a, b])
    const frame = createCore(options).update(detection, 0, pick)
    const oneDegree = gazeDegreesToPixels(1, gazeToScreen(detection, undefined, { screen })!.distance, undefined, {
      screen,
    })
    return (Math.atan((frame.radius / oneDegree) * Math.tan(Math.PI / 180)) * 180) / Math.PI
  }

  it('is wide by default, without a calibration or with one that carries no residual error', () => {
    expect(GazePointerCoreDefaults.tolerance).toBe(4)
    expect(toleranceOf({})).toBeCloseTo(4, 6)
    expect(toleranceOf({ calibration: { eyes: { gain: [1, 1] } } })).toBeCloseTo(4, 6)
  })

  it('follows the residual error of the calibration, with a floor of 2 degrees', () => {
    expect(toleranceOf({ calibration: { residual: 3.2 } })).toBeCloseTo(3.2, 6)
    expect(toleranceOf({ calibration: { residual: 0.7 } })).toBeCloseTo(2, 6)
  })

  it('is forced by an explicit tolerance, over both', () => {
    expect(toleranceOf({ tolerance: 1 })).toBeCloseTo(1, 6)
    expect(toleranceOf({ tolerance: 1, calibration: { residual: 3.2 } })).toBeCloseTo(1, 6)
    expect(toleranceOf({ tolerance: 6, calibration: { residual: 0.7 } })).toBeCloseTo(6, 6)
  })

  it('is what `resolveGazeTolerance` returns', () => {
    expect(resolveGazeTolerance()).toBe(4)
    expect(resolveGazeTolerance(undefined, { residual: 3.2 })).toBe(3.2)
    expect(resolveGazeTolerance(undefined, { residual: 0.7 })).toBe(2)
    expect(resolveGazeTolerance(1, { residual: 3.2 })).toBe(1)
  })

  it('lets a target next to the gaze be picked: the disc reaches it', () => {
    // 100 pixels to the left of a: within the 4 degrees of the default tolerance, out of a tolerance of 1 degree
    const beside = { x: a.left - 100, y: 540 }

    const wide = createCore()
    const narrow = createCore({ tolerance: 1 })
    const { pick } = createPick([a, b])

    expect(transitionsOf(run(wide, pick, { gaze: () => beside, to: 1000 }))).toEqual(['enter a'])
    expect(transitionsOf(run(narrow, pick, { gaze: () => beside, to: 1000 }))).toEqual([])
  })

  it('makes a larger disc when the user is farther from the screen', () => {
    const { pick } = createPick([a, b])
    const radiusAt = (depth: number) => {
      const detection = synthesizeGaze({ target: centerOf(a), screen, head: { position: [0, -12, -depth] } })
      return createCore({ tolerance: 2 }).update(detection, 0, pick).radius
    }

    expect(radiusAt(80) / radiusAt(40)).toBeGreaterThan(1.8)
    expect(radiusAt(80) / radiusAt(40)).toBeLessThan(2.2)
  })
})

describe('disabling', () => {
  it('releases the current target with a leave, and does nothing while disabled', () => {
    const core = createCore()
    const { pick, calls } = createPick([a, b])
    run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    expect(core.enabled).toBe(true)

    const events = core.disable()

    expect(eventsOf([{ events }])).toEqual(['leave a'])
    expect(events[0].hit).toBeDefined()
    expect(core.enabled).toBe(false)
    expect(core.target).toBeNull()
    expect(core.point).toBeNull()

    // disabled: frames are ignored, the pick function is not asked
    const picks = calls.length
    const samples = run(core, pick, { gaze: () => centerOf(a), from: 1000, to: 2000 })
    expect(calls).toHaveLength(picks)
    expect(samples.every((sample) => sample.point === null && sample.target === null && sample.radius === 0)).toBe(true)
    expect(eventsOf(samples)).toEqual([])

    // disabling twice emits nothing more
    expect(core.disable()).toEqual([])
  })

  it('emits nothing when there was no target', () => {
    const core = createCore()

    expect(core.disable()).toEqual([])
  })

  it('elects afresh once enabled again', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    core.disable()
    run(core, pick, { gaze: () => centerOf(a), from: 1000, to: 2000 })

    core.enable()
    const samples = run(core, pick, { gaze: () => centerOf(b), from: 2000, to: 3000 })

    expect(core.enabled).toBe(true)
    // not on the first frame: the votes cast before the core was disabled are gone
    expect(samples[0].events).toEqual([])
    expect(transitionsOf(samples)).toEqual(['enter b'])
    expect(timeOf(samples, 'enter b')).toBeGreaterThanOrEqual(2090)
  })
})

describe('changing the options at runtime', () => {
  it('keeps the current target', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const before = run(core, pick, { gaze: () => centerOf(a), to: 1000 })

    core.setOptions({
      screen,
      tolerance: 2,
      voteWindow: 400,
      blinkGrace: 100,
      filter: { timeConstant: 300 },
      calibration: { eyes: { gain: [1, 1], offset: [0, 0] } },
    })
    const after = run(core, pick, { gaze: () => centerOf(a), from: 1000, to: 2000 })

    expect(transitionsOf(before)).toEqual(['enter a'])
    expect(transitionsOf(after)).toEqual([])
    expect(after.every((sample) => sample.target === a)).toBe(true)
    expect(eventsOf(after)).toEqual(after.map(() => 'move a'))
  })

  it('applies the new options from the next frame', () => {
    const core = createCore({ tolerance: 2 })
    const { pick } = createPick([a, b])
    const [first] = run(core, pick, { gaze: () => centerOf(a), to: 30 })

    core.setOptions({ screen, tolerance: 4, blinkGrace: 0 })
    const samples = run(core, pick, { gaze: () => centerOf(a), from: 30, to: 1000 })

    // the tolerance: a disc about twice as large
    expect(samples[0].radius / first.radius).toBeGreaterThan(1.9)
    expect(samples[0].radius / first.radius).toBeLessThan(2.1)
    // the grace: a blink now releases at once
    expect(eventsOf([core.update(blink(centerOf(a)), 1000, pick)])).toEqual(['leave a'])
  })

  it('replaces the options as a whole: an absent field is back to its default', () => {
    const core = createCore({ tolerance: 2 })
    const { pick } = createPick([a, b])
    const [first] = run(core, pick, { gaze: () => centerOf(a), to: 30 })

    core.setOptions({ screen })
    const [second] = run(core, pick, { gaze: () => centerOf(a), from: 30, to: 60 })

    expect(second.radius / first.radius).toBeGreaterThan(1.9)
  })

  it('keeps the filter going when the filter options have not changed', () => {
    const steadiness = (reset: boolean) => {
      const core = createCore({ filter: { timeConstant: 300 } })
      const { pick } = createPick([a, b])
      run(core, pick, { gaze: () => centerOf(a), to: 2000, sigma: 1 })
      // the same values in a new object, as a component does on every render; or other values
      core.setOptions({ screen, filter: { timeConstant: reset ? 299 : 300 } })
      const [next] = run(core, pick, { gaze: () => centerOf(a), from: 2000, to: 2030, sigma: 1 })
      return { point: next.point!, raw: next.raw! }
    }

    // unchanged: the point is still the average of the fixation, not the raw point of the frame
    const kept = steadiness(false)
    expect(Math.hypot(kept.point.x - kept.raw.x, kept.point.y - kept.raw.y)).toBeGreaterThan(5)
    // changed: the filter restarts from the raw point
    const restarted = steadiness(true)
    expect(restarted.point.x).toBeCloseTo(restarted.raw.x, 6)
    expect(restarted.point.y).toBeCloseTo(restarted.raw.y, 6)
  })
})

describe('clicking on demand', () => {
  it('emits down, up, then click on the current target, with its latest hit', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    const samples = run(core, pick, { gaze: () => centerOf(a), to: 1000 })

    const events = core.click()

    expect(eventsOf([{ events }])).toEqual(['down a', 'up a', 'click a'])
    const last = samples[samples.length - 1]
    for (const event of events) {
      expect(event.target).toBe(a)
      expect(event.hit).toEqual({ point: last.point, distance: 0 })
    }
    // the target is still held, and can be clicked again
    expect(core.target).toBe(a)
    expect(eventsOf([{ events: core.click() }])).toEqual(['down a', 'up a', 'click a'])
  })

  it('emits nothing without a target', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    expect(core.click()).toEqual([])

    // the gaze is on the screen, with nothing under it
    run(core, pick, { gaze: () => ({ x: 300, y: 200 }), to: 1000 })
    expect(core.click()).toEqual([])

    // a target, then the core is disabled
    run(core, pick, { gaze: () => centerOf(a), from: 1000, to: 2000 })
    expect(core.target).toBe(a)
    core.disable()
    expect(core.click()).toEqual([])
  })

  it('clicks the frozen target during a blink within the grace delay', () => {
    const core = createCore()
    const { pick } = createPick([a, b])
    run(core, pick, { gaze: () => centerOf(a), to: 1000 })
    run(core, pick, { gaze: () => 'blink', from: 1000, to: 1100 })

    expect(eventsOf([{ events: core.click() }])).toEqual(['down a', 'up a', 'click a'])
  })
})

describe('dwell', () => {
  /** The events of a run that belong to a click, in order. */
  const clicksOf = (samples: { events: GazePointerEvent<Rectangle, Hit>[] }[]) =>
    eventsOf(samples).filter((event) => /^(down|up|click) /.test(event))

  /** The enters and leaves of a run, in order. */
  const hoversOf = (samples: { events: GazePointerEvent<Rectangle, Hit>[] }[]) =>
    eventsOf(samples).filter((event) => /^(enter|leave) /.test(event))

  /** The sample of the frame at `time`, or the first one after it. */
  const at = (samples: Sample[], time: number) => samples.find((sample) => sample.time >= time)!

  it('is off by default: staring at a target never clicks it, and there is no progress', () => {
    const core = createCore()
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: () => centerOf(a), to: 5000 })

    expect(hoversOf(samples)).toEqual(['enter a'])
    expect(clicksOf(samples)).toEqual([])
    expect(samples.every((sample) => sample.dwellProgress === null)).toBe(true)
  })

  it('clicks the target once it has been held for the duration: down, up, click, after the move', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: () => centerOf(a), to: 1500 })

    const entered = timeOf(samples, 'enter a')!
    const clicked = samples.find((sample) => eventsOf([sample]).includes('click a'))!
    expect(eventsOf([clicked])).toEqual(['move a', 'down a', 'up a', 'click a'])
    // the first frame at or after the deadline
    expect(clicked.time - entered).toBeGreaterThanOrEqual(1000)
    expect(clicked.time - entered).toBeLessThan(1000 + 34)
    // the events of the click carry the target and its latest hit
    for (const event of clicked.events) {
      expect(event.target).toBe(a)
      expect(event.hit).toEqual({ point: clicked.point, distance: 0 })
    }
    expect(clicksOf(samples)).toEqual(['down a', 'up a', 'click a'])
  })

  it('reports the progress of the current target, from 0 to 1, on every frame while it is held', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    const samples = run(core, pick, { gaze: (time) => (time < 2000 ? centerOf(a) : away), to: 3000 })

    const entered = timeOf(samples, 'enter a')!
    const left = timeOf(samples, 'leave a')!
    for (const sample of samples) {
      if (sample.time < entered || sample.time >= left) {
        // no target: no progress
        expect(sample.target).toBeNull()
        expect(sample.dwellProgress).toBeNull()
      } else {
        // the share of the duration the target has been held for, 1 once it is over
        expect(sample.dwellProgress).toBeCloseTo(Math.min(1, (sample.time - entered) / 1000), 6)
      }
    }
    expect(at(samples, entered).dwellProgress).toBe(0)
    expect(at(samples, entered + 500).dwellProgress).toBeGreaterThan(0.45)
    expect(at(samples, entered + 500).dwellProgress).toBeLessThan(0.55)
    // it reaches 1 in the frame of the click
    const clicked = samples.find((sample) => eventsOf([sample]).includes('click a'))!
    expect(clicked.dwellProgress).toBe(1)
    expect(samples.filter((sample) => sample.dwellProgress === 1).length).toBeGreaterThan(20)
  })

  it('measures the duration in milliseconds: the same deadline at 30 and at 60 frames per second', () => {
    const clickedAfter = (rate: number, dwell: number) => {
      const core = createCore({ dwell })
      const { pick } = createPick([a, b])
      const samples = run(core, pick, { gaze: () => centerOf(a), to: 3000, rate })
      return timeOf(samples, 'click a')! - timeOf(samples, 'enter a')!
    }

    for (const rate of [30, 60]) {
      expect(clickedAfter(rate, 800)).toBeGreaterThanOrEqual(800)
      expect(clickedAfter(rate, 800)).toBeLessThan(800 + 34)
      expect(clickedAfter(rate, 2000)).toBeGreaterThanOrEqual(2000)
      expect(clickedAfter(rate, 2000)).toBeLessThan(2000 + 34)
    }
  })

  it('clicks a target once: it has to be left before the dwell can click it again', () => {
    const core = createCore({ dwell: 500 })
    const { pick } = createPick([a, b])

    // three seconds on a, six times the duration: one click
    const first = run(core, pick, { gaze: () => centerOf(a), to: 3000 })
    expect(clicksOf(first)).toEqual(['down a', 'up a', 'click a'])
    expect(first[first.length - 1].dwellProgress).toBe(1)

    // b, then a again: each is clicked once more, a full duration after it was entered
    const second = run(core, pick, { gaze: (time) => centerOf(time < 4500 ? b : a), from: 3000, to: 6000 })
    expect(clicksOf(second)).toEqual(['down b', 'up b', 'click b', 'down a', 'up a', 'click a'])
    const entered = timeOf(second, 'enter a')!
    expect(at(second, entered).dwellProgress).toBe(0)
    expect(timeOf(second, 'click a')! - entered).toBeGreaterThanOrEqual(500)
    expect(timeOf(second, 'click a')! - entered).toBeLessThan(500 + 34)
  })

  it('leaves the on-demand click alone: it is not subject to the re-arm rule and does not change the dwell', () => {
    const withClicks = createCore({ dwell: 1000 })
    const without = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    // an on-demand click half way: the dwell click still comes, at the same time, with the same progress
    const before = run(withClicks, pick, { gaze: () => centerOf(a), to: 600 })
    expect(eventsOf([{ events: withClicks.click() }])).toEqual(['down a', 'up a', 'click a'])
    const after = run(withClicks, pick, { gaze: () => centerOf(a), from: 600, to: 2000 })
    const reference = run(without, pick, { gaze: () => centerOf(a), to: 2000 })

    expect(clicksOf(after)).toEqual(['down a', 'up a', 'click a'])
    expect(timeOf(after, 'click a')).toBe(timeOf(reference, 'click a'))
    expect([...before, ...after].map((sample) => sample.dwellProgress)).toEqual(
      reference.map((sample) => sample.dwellProgress)
    )

    // after the dwell click: on-demand clicks still go through, as many as asked, and do not re-arm the dwell
    expect(eventsOf([{ events: withClicks.click() }])).toEqual(['down a', 'up a', 'click a'])
    expect(eventsOf([{ events: withClicks.click() }])).toEqual(['down a', 'up a', 'click a'])
    const later = run(withClicks, pick, { gaze: () => centerOf(a), from: 2000, to: 5000 })
    expect(clicksOf(later)).toEqual([])
    expect(later.every((sample) => sample.dwellProgress === 1)).toBe(true)
  })

  it('is cancelled when the user looks away: the clock starts from zero on the way back', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    // 700 ms or so on a, off the screen, then a again
    const samples = run(core, pick, {
      gaze: (time) => (time >= 800 && time < 1500 ? away : centerOf(a)),
      to: 4000,
    })

    expect(hoversOf(samples)).toEqual(['enter a', 'leave a', 'enter a'])
    expect(clicksOf(samples)).toEqual(['down a', 'up a', 'click a'])

    const left = timeOf(samples, 'leave a')!
    const back = samples.find((sample) => sample.time > left && eventsOf([sample]).includes('enter a'))!
    expect(at(samples, left).dwellProgress).toBeNull()
    expect(back.dwellProgress).toBe(0)
    const clicked = timeOf(samples, 'click a')!
    expect(clicked - back.time).toBeGreaterThanOrEqual(1000)
    expect(clicked - back.time).toBeLessThan(1000 + 34)
  })

  it('is cancelled when the signal is lost beyond the grace delay', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    // the face is gone for 500 ms, more than the 300 ms of the grace
    const samples = run(core, pick, {
      gaze: (time) => (time >= 800 && time < 1300 ? 'gone' : centerOf(a)),
      to: 4000,
    })

    expect(hoversOf(samples)).toEqual(['enter a', 'leave a', 'enter a'])
    expect(clicksOf(samples)).toEqual(['down a', 'up a', 'click a'])

    const left = timeOf(samples, 'leave a')!
    const back = samples.find((sample) => sample.time > left && eventsOf([sample]).includes('enter a'))!
    expect(at(samples, left).dwellProgress).toBeNull()
    expect(timeOf(samples, 'click a')! - back.time).toBeGreaterThanOrEqual(1000)
    expect(timeOf(samples, 'click a')! - back.time).toBeLessThan(1000 + 34)
  })

  it('is cancelled when the core is disabled', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    run(core, pick, { gaze: () => centerOf(a), to: 800 })
    core.disable()
    core.enable()
    const samples = run(core, pick, { gaze: () => centerOf(a), from: 800, to: 3000 })

    const entered = timeOf(samples, 'enter a')!
    expect(at(samples, entered).dwellProgress).toBe(0)
    expect(timeOf(samples, 'click a')! - entered).toBeGreaterThanOrEqual(1000)
  })

  it('survives a blink within the grace delay: the clock keeps running, the click comes on time', () => {
    const blinking = createCore({ dwell: 1000 })
    const steady = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    // a blink of 200 ms in the middle of the dwell
    const samples = run(blinking, pick, {
      gaze: (time) => (time >= 500 && time < 700 ? 'blink' : centerOf(a)),
      to: 2000,
    })
    const reference = run(steady, pick, { gaze: () => centerOf(a), to: 2000 })

    expect(hoversOf(samples)).toEqual(['enter a'])
    expect(clicksOf(samples)).toEqual(['down a', 'up a', 'click a'])
    // neither cancelled nor delayed: the same click, and the same progress on every frame, the closed ones included
    expect(timeOf(samples, 'click a')).toBe(timeOf(reference, 'click a'))
    expect(samples.map((sample) => sample.dwellProgress)).toEqual(reference.map((sample) => sample.dwellProgress))
    const during = samples.filter((sample) => sample.time >= 500 && sample.time < 700)
    expect(during.every((sample) => sample.point === null && sample.dwellProgress! > 0.3)).toBe(true)
  })

  it('waits for the eyes to reopen when the deadline falls during a blink', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    const start = run(core, pick, { gaze: () => centerOf(a), to: 500 })
    const deadline = timeOf(start, 'enter a')! + 1000
    // the eyes close 100 ms before the deadline, and reopen 100 ms after it
    const rest = run(core, pick, {
      gaze: (time) => (time >= deadline - 100 && time < deadline + 100 ? 'blink' : centerOf(a)),
      from: 500,
      to: 2000,
    })

    // nothing is emitted while the eyes are closed, although the progress has reached 1
    const during = rest.filter((sample) => sample.time >= deadline - 100 && sample.time < deadline + 100)
    expect(eventsOf(during)).toEqual([])
    expect(during[during.length - 1].dwellProgress).toBe(1)
    // the click comes with the first frame after the blink
    const reopened = at(rest, deadline + 100)
    expect(eventsOf([reopened])).toEqual(['move a', 'down a', 'up a', 'click a'])
    expect(clicksOf(rest)).toEqual(['down a', 'up a', 'click a'])
  })

  it('never clicks when the signal is lost before the deadline and does not come back', () => {
    const core = createCore({ dwell: 1000 })
    const { pick } = createPick([a, b])

    const start = run(core, pick, { gaze: () => centerOf(a), to: 500 })
    const deadline = timeOf(start, 'enter a')! + 1000
    const rest = run(core, pick, {
      gaze: (time) => (time >= deadline - 100 ? 'gone' : centerOf(a)),
      from: 500,
      to: 3000,
    })

    expect(hoversOf(rest)).toEqual(['leave a'])
    expect(clicksOf(rest)).toEqual([])
    expect(rest[rest.length - 1].dwellProgress).toBeNull()
  })

  describe('changing the duration at runtime', () => {
    it('does not click by itself a target already held for longer than the new duration', () => {
      for (const initial of [false, 5000] as const) {
        const core = createCore({ dwell: initial })
        const { pick } = createPick([a, b])
        const before = run(core, pick, { gaze: () => centerOf(a), to: 2000 })
        expect(clicksOf(before)).toEqual([])

        // held for about 1900 ms, and the duration becomes 500 ms: the clock restarts
        core.setOptions({ screen, dwell: 500 })
        const after = run(core, pick, { gaze: () => centerOf(a), from: 2000, to: 4000 })

        expect(eventsOf([after[0]])).toEqual(['move a'])
        expect(after[0].dwellProgress).toBeLessThan(0.1)
        expect(clicksOf(after)).toEqual(['down a', 'up a', 'click a'])
        // 500 ms after the change, which happened between the frame before 2000 ms and the one at 2000 ms
        const clicked = timeOf(after, 'click a')!
        expect(clicked).toBeGreaterThanOrEqual(2000 + 500 - 34)
        expect(clicked).toBeLessThan(2000 + 500 + 34)
      }
    })

    it('keeps the clock going when the duration has not changed', () => {
      const core = createCore({ dwell: 1000 })
      const steady = createCore({ dwell: 1000 })
      const { pick } = createPick([a, b])

      // the same options on every frame, as a component does on every render
      const clicks: number[] = []
      for (let i = 0; i < 60; i++) {
        const time = (i * 1000) / 30
        core.setOptions({ screen, dwell: 1000 })
        if (eventsOf([core.update(look(centerOf(a)), time, pick)]).includes('click a')) clicks.push(time)
      }

      const reference = run(steady, pick, { gaze: () => centerOf(a), to: 2000 })
      expect(clicks).toEqual([timeOf(reference, 'click a')])
    })

    it('stops the dwell when it is turned off', () => {
      const core = createCore({ dwell: 1000 })
      const { pick } = createPick([a, b])
      run(core, pick, { gaze: () => centerOf(a), to: 600 })

      core.setOptions({ screen })
      const samples = run(core, pick, { gaze: () => centerOf(a), from: 600, to: 3000 })

      expect(clicksOf(samples)).toEqual([])
      expect(samples.every((sample) => sample.dwellProgress === null)).toBe(true)
    })

    it('does not re-arm a target the dwell has already clicked', () => {
      const core = createCore({ dwell: 500 })
      const { pick } = createPick([a, b])
      const before = run(core, pick, { gaze: () => centerOf(a), to: 1000 })
      expect(clicksOf(before)).toEqual(['down a', 'up a', 'click a'])

      core.setOptions({ screen, dwell: 300 })
      const after = run(core, pick, { gaze: () => centerOf(a), from: 1000, to: 3000 })

      expect(clicksOf(after)).toEqual([])
      expect(after.every((sample) => sample.dwellProgress === 1)).toBe(true)
    })
  })
})
