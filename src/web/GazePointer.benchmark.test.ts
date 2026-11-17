import { describe, expect, it } from 'vitest'
import {
  createGazeBenchmarkRecorder,
  GAZE_BENCHMARK_SETTLE,
  GAZE_BENCHMARK_VERSION,
  gazeBenchmarkSequence,
  replayGazeBenchmark,
  scoreGazeBenchmark,
  type GazeBenchmarkFrame,
  type GazeBenchmarkSession,
  type GazeBenchmarkTarget,
} from './GazePointer.benchmark'
import type { GazeDetection } from './GazePointer.model'
import { synthesizeGaze } from './GazePointer.model.test-utils'

//
// Fixtures: a 1920 x 1080 screen of 48 x 27 cm (40 pixels per centimetre), and a 4 by 3 grid of targets covering it.
//

const screen = { width: 1920, height: 1080 }
const calibration = { screen: { width: 48, height: 27 } }

const COLUMNS = 4
const ROWS = 3

/** Twelve targets of 480 x 360 pixels, `t0` at the top left, row by row. */
const targets: GazeBenchmarkTarget[] = Array.from({ length: COLUMNS * ROWS }, (_, index) => ({
  id: `t${index}`,
  left: (index % COLUMNS) * 480,
  top: Math.floor(index / COLUMNS) * 360,
  width: 480,
  height: 360,
}))

const centerOf = (id: string) => {
  const target = targets.find((candidate) => candidate.id === id)!
  return { x: target.left + target.width / 2, y: target.top + target.height / 2 }
}

/** The eyes are 60 cm from the screen: one visual degree is 60 * tan(1 degree) * 40 = 41.892 pixels. */
const DISTANCE = 60
const ONE_DEGREE = 41.892
const TWO_DEGREES = 83.81
const TEN_DEGREES = 423.19

/** What the pointer did during one frame of a hand-written session. */
type Told = { elected: string | null; offset?: number | null }

/**
 * A hand-written session: one frame every 100 ms, each target lit for `duration` ms, one after the other.
 * `tell` says, for a frame `since` ms after its target lit up, what was elected and how far (in pixels, to the right
 * of the centre of the lit target) the gaze point was; an `offset` of `null` is a frame without a gaze point.
 */
function session(lit: string[], duration: number, tell: (lit: string, since: number) => Told) {
  const frames: GazeBenchmarkFrame[] = []
  lit.forEach((id, trial) => {
    for (let since = 0; since < duration; since += 100) {
      const { elected, offset = 0 } = tell(id, since)
      const center = centerOf(id)
      frames.push({
        time: trial * duration + since,
        lit: id,
        elected,
        point: offset === null ? null : { x: center.x + offset, y: center.y },
        distance: offset === null ? null : DISTANCE,
      })
    }
  })
  return { screen, calibration, targets, frames }
}

describe('scoreGazeBenchmark', () => {
  it('gives a share of 1 when the lit target is the elected one all along', () => {
    const score = scoreGazeBenchmark(session(['t0', 't5'], 2000, (lit) => ({ elected: lit })))

    expect(score.correctShare).toBe(1)
  })

  it('gives the share of the time the lit target was the elected one', () => {
    // settled from 1000 ms on: the frames at 1000 ... 2900 span 1900 ms, a neighbour is elected from 2000 to 2900
    const score = scoreGazeBenchmark(
      session(['t5'], 3000, (lit, since) => ({ elected: since < 2000 ? lit : 't6' })),
      { settle: 1000 }
    )

    expect(score.correctShare).toBeCloseTo(1000 / 1900, 10)
    expect(score.scoredTime).toBe(1900)
  })

  it('leaves the settling time after a target lights up out of the measures, and says how long it was', () => {
    // the pointer is still on the previous target for the first 400 ms of each target
    const previous = (lit: string) => (lit === 't0' ? 't7' : 't0')
    const score = scoreGazeBenchmark(
      session(['t0', 't7', 't0'], 2000, (lit, since) => ({ elected: since < 400 ? previous(lit) : lit })),
      { settle: 500 }
    )

    expect(score.settle).toBe(500)
    expect(score.correctShare).toBe(1)
    expect(score.changesPer10s).toBe(0)
    // per target: the frames at 500 ... 1900
    expect(score.frames).toBe(3 * 15)
    expect(score.scoredTime).toBe(3 * 1400)
  })

  it('settles for GAZE_BENCHMARK_SETTLE by default', () => {
    const score = scoreGazeBenchmark(session(['t0'], 2000, (lit) => ({ elected: lit })))

    expect(GAZE_BENCHMARK_SETTLE).toBe(750)
    expect(score.settle).toBe(750)
    // the frames at 800 ... 1900
    expect(score.frames).toBe(12)
  })

  it('counts the target changes per 10 seconds while a target is lit', () => {
    // 10 s scored (500 ... 10500). The pointer leaves for a neighbour and comes back, twice: 4 changes.
    const away = (since: number) => (since >= 3000 && since < 3300) || (since >= 7000 && since < 7200)
    const score = scoreGazeBenchmark(
      session(['t5'], 10600, (lit, since) => ({ elected: away(since) ? 't6' : lit })),
      { settle: 500 }
    )

    expect(score.scoredTime).toBe(10000)
    expect(score.changesPer10s).toBeCloseTo(4, 10)
  })

  it('counts losing the target and getting it back as two changes', () => {
    const score = scoreGazeBenchmark(
      session(['t5'], 10600, (lit, since) => ({ elected: since === 5000 ? null : lit })),
      { settle: 500 }
    )

    expect(score.changesPer10s).toBeCloseTo(2, 10)
  })

  it('does not count the change that comes with a new lit target', () => {
    const score = scoreGazeBenchmark(
      session(['t0', 't1', 't2'], 2000, (lit) => ({ elected: lit })),
      { settle: 0 }
    )

    expect(score.changesPer10s).toBe(0)
    expect(score.correctShare).toBe(1)
  })

  it('gives the median angle between the gaze point and the centre of the lit target', () => {
    // three settled frames, 1, 2 and 10 degrees away
    const offsets: Record<number, number> = { 500: ONE_DEGREE, 600: TEN_DEGREES, 700: TWO_DEGREES }
    const score = scoreGazeBenchmark(
      session(['t5'], 800, (lit, since) => ({ elected: lit, offset: offsets[since] ?? 0 })),
      { settle: 500 }
    )

    expect(score.medianError).toBeCloseTo(2, 3)
  })

  it('gives the mean of the two middle angles for an even number of frames', () => {
    const offsets: Record<number, number> = { 500: ONE_DEGREE, 600: TWO_DEGREES }
    const score = scoreGazeBenchmark(
      session(['t5'], 700, (lit, since) => ({ elected: lit, offset: offsets[since] ?? 0 })),
      { settle: 500 }
    )

    expect(score.medianError).toBeCloseTo(1.5, 3)
  })

  it('keeps the frames without a gaze point in the share and the changes, and out of the error', () => {
    // settled frames at 500 ... 1400 (900 ms). No point from 1000 on: the target is held for 200 ms, then lost.
    const score = scoreGazeBenchmark(
      session(['t5'], 1500, (lit, since) => ({
        elected: since < 1200 ? lit : null,
        offset: since < 1000 ? ONE_DEGREE : null,
      })),
      { settle: 500 }
    )

    expect(score.framesWithoutPoint).toBe(5)
    expect(score.correctShare).toBeCloseTo(700 / 900, 10)
    expect(score.changesPer10s).toBeCloseTo((1 / 900) * 10000, 10)
    expect(score.medianError).toBeCloseTo(1, 3)
  })

  it('has nothing to say about a session with no settled frame', () => {
    const score = scoreGazeBenchmark(
      session(['t5'], 400, (lit) => ({ elected: lit })),
      { settle: 500 }
    )

    expect(score).toMatchObject({ correctShare: null, changesPer10s: null, medianError: null, frames: 0 })
  })

  it('ignores the frames during which no target is lit', () => {
    const { frames, ...rest } = session(['t5'], 2000, (lit) => ({ elected: lit }))
    const pause: GazeBenchmarkFrame[] = [2000, 2100, 2200].map((time) => ({
      time,
      lit: null,
      elected: 't5',
      point: null,
      distance: null,
    }))

    const score = scoreGazeBenchmark({ ...rest, frames: [...frames, ...pause] }, { settle: 500 })

    expect(score.frames).toBe(15)
    expect(score.scoredTime).toBe(1400)
  })
})

describe('gazeBenchmarkSequence', () => {
  it('lights each target the same number of times', () => {
    const sequence = gazeBenchmarkSequence(12, 3, 7)

    expect(sequence).toHaveLength(36)
    for (let target = 0; target < 12; target++) {
      expect(sequence.filter((index) => index === target)).toHaveLength(3)
    }
  })

  it('goes through every target before lighting one again', () => {
    const sequence = gazeBenchmarkSequence(12, 2, 7)

    expect([...sequence.slice(0, 12)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect([...sequence.slice(12)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  })

  it('is in a random order that only depends on the seed', () => {
    const sequence = gazeBenchmarkSequence(12, 2, 7)

    expect(gazeBenchmarkSequence(12, 2, 7)).toEqual(sequence)
    expect(gazeBenchmarkSequence(12, 2, 8)).not.toEqual(sequence)
    expect(sequence.slice(0, 12)).not.toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(sequence.slice(12)).not.toEqual(sequence.slice(0, 12))
  })

  it('never lights the same target twice in a row', () => {
    for (let seed = 0; seed < 200; seed++) {
      const sequence = gazeBenchmarkSequence(3, 4, seed)
      for (let i = 1; i < sequence.length; i++) expect(sequence[i]).not.toBe(sequence[i - 1])
    }
  })
})

//
// A recorded session: a synthetic face (`synthesizeGaze`) looks at each lit target in turn. The webcam gives 30
// detections per second, the page renders 60 frames per second: every detection is seen by two frames.
//

/** The same grid, each target shrunk by 60 pixels on every side: 120 pixel wide gaps between neighbours. */
const spacedTargets: GazeBenchmarkTarget[] = targets.map((target) => ({
  id: target.id,
  left: target.left + 60,
  top: target.top + 60,
  width: target.width - 120,
  height: target.height - 120,
}))

type Recorded = {
  /** Where the face looks, `since` ms after the target `lit` lit up. `null`: no face in front of the webcam. */
  gazeAt?: (lit: string, since: number) => { x: number; y: number } | null
  layout?: GazeBenchmarkTarget[]
  options?: GazeBenchmarkSession['options']
  landmarks?: 'eyes' | 'all'
}

const LIT_ORDER = ['t0', 't5', 't11', 't6', 't3', 't8']
const LIT_DURATION = 2000

/** Records a session of 6 targets lit for 2 seconds each, and hands it back as read from its JSON export. */
function recorded({ gazeAt = centerOf, layout = targets, options = {}, landmarks }: Recorded = {}) {
  const recorder = createGazeBenchmarkRecorder({
    recordedAt: '2026-01-01T00:00:00.000Z',
    screen,
    viewport: { x: 0, y: 0 },
    canvas: { left: 0, top: 0, width: 1920, height: 1080 },
    calibration: {},
    calibrationSamples: [],
    options,
    litDuration: LIT_DURATION,
    seed: 1,
    targets: layout,
    landmarks,
  })

  let detection: GazeDetection | undefined
  for (let frame = 0; frame < (LIT_ORDER.length * LIT_DURATION * 60) / 1000; frame++) {
    const time = (frame * 1000) / 60
    const id = LIT_ORDER[Math.floor(time / LIT_DURATION)]
    if (frame % 2 === 0) {
      const target = gazeAt(id, time % LIT_DURATION)
      detection = target ? synthesizeGaze({ target, screen }) : { faceLandmarks: [] }
    }
    // what the pointer made of the frame is not what a replay reads: it is left empty
    recorder.record({ time, lit: id, elected: null, point: null, distance: null, detection })
  }

  const exported = JSON.stringify(recorder.finish())
  return { session: JSON.parse(exported) as GazeBenchmarkSession, size: exported.length }
}

describe('createGazeBenchmarkRecorder', () => {
  it('writes a versioned session that holds each detection once', () => {
    const { session } = recorded()

    expect(session.version).toBe(GAZE_BENCHMARK_VERSION)
    expect(session.frames).toHaveLength(720)
    expect(session.detections).toHaveLength(360)
    // two frames per detection
    expect(session.frames.slice(0, 4).map((frame) => frame.detection)).toEqual([0, 0, 1, 1])
  })

  it('keeps the matrix, the blendshapes and the eye landmarks of each detection, rounded', () => {
    const { session, size } = recorded()
    const [first] = session.detections

    expect(first.matrix).toHaveLength(16)
    expect(session.detectionLayout.blendshapes).toHaveLength(52)
    expect(first.blendshapes).toHaveLength(52)
    // the two irises (468 to 477) and the contours of the two eyes
    expect(session.detectionLayout.landmarks).toEqual(expect.arrayContaining([468, 473, 33, 133, 263, 362]))
    expect(session.detectionLayout.landmarks).toHaveLength(42)
    expect(first.landmarks).toHaveLength(42 * 3)
    for (const value of first.landmarks) expect(value).toBe(Math.round(value * 1e5) / 1e5)

    // a detection and its two frames weigh less than 2 kB
    expect(size / session.detections.length).toBeLessThan(2000)
  })

  it('keeps every landmark when asked to', () => {
    const { session } = recorded({ landmarks: 'all' })

    expect(session.detectionLayout.landmarks).toHaveLength(478)
    expect(session.detections[0].landmarks).toHaveLength(478 * 3)
  })

  it('writes a frame without a face as a frame without detection', () => {
    const { session } = recorded({ gazeAt: (lit, since) => (since < 1000 ? centerOf(lit) : null) })

    expect(session.frames[0].detection).toBe(0)
    expect(session.frames[90].detection).toBeNull()
  })
})

describe('replayGazeBenchmark', () => {
  it('elects the lit target all along when the face looks at its centre', () => {
    const score = replayGazeBenchmark(recorded().session)

    expect(score.correctShare).toBe(1)
    expect(score.changesPer10s).toBe(0)
    expect(score.medianError).toBeLessThan(0.05)
    expect(score.settle).toBe(GAZE_BENCHMARK_SETTLE)
  })

  it('reads the gaze from the iris landmarks when asked to', () => {
    const score = replayGazeBenchmark(recorded().session, { eyeSignal: 'iris' })

    expect(score.correctShare).toBe(1)
    expect(score.medianError).toBeLessThan(0.2)
  })

  it('runs under the calibration it is given', () => {
    // eyes read 3 degrees too high: the gaze point is 3 degrees off, which the wide targets still absorb
    const score = replayGazeBenchmark(recorded().session, { calibration: { eyes: { offset: [0, 3] } } })

    expect(score.medianError).toBeGreaterThan(2.7)
    expect(score.medianError).toBeLessThan(3.3)
    expect(score.correctShare).toBe(1)
  })

  it('picks over the recorded target layout with the tolerance it is given', () => {
    // the face looks 30 pixels to the right of the lit target, in the gap before its neighbour (90 pixels away);
    // 2 degrees are about 80 pixels there
    const { session } = recorded({
      gazeAt: (lit) => {
        const target = spacedTargets.find((candidate) => candidate.id === lit)!
        return { x: target.left + target.width + 30, y: target.top + target.height / 2 }
      },
      layout: spacedTargets,
      options: { tolerance: 2 },
    })

    // as recorded
    expect(replayGazeBenchmark(session).correctShare).toBe(1)
    // a cone too narrow to reach the target
    expect(replayGazeBenchmark(session, { tolerance: 0.5 }).correctShare).toBe(0)
  })

  it('takes the settling time it is given', () => {
    // the face looks at the previous target for the first 600 ms
    const previous = (lit: string) => LIT_ORDER[(LIT_ORDER.indexOf(lit) + LIT_ORDER.length - 1) % LIT_ORDER.length]
    const { session } = recorded({ gazeAt: (lit, since) => centerOf(since < 600 ? previous(lit) : lit) })

    expect(replayGazeBenchmark(session, { settle: 1000 }).correctShare).toBe(1)
    expect(replayGazeBenchmark(session, { settle: 0 }).correctShare).toBeLessThan(0.75)
  })

  it('loses the target when the face is lost', () => {
    const { session } = recorded({ gazeAt: (lit, since) => (since < 1000 ? centerOf(lit) : null) })

    const score = replayGazeBenchmark(session, { settle: 500, blinkGrace: 0 })

    // per target: settled from 500 ms, the face is there until 1000 ms
    expect(score.correctShare).toBeGreaterThan(0.3)
    expect(score.correctShare).toBeLessThan(0.36)
    expect(score.framesWithoutPoint).toBeGreaterThan(0)
  })
})
