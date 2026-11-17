//
// Benchmark of the gaze pointer: scoring a session, and what goes with it.
//
// A session is what the benchmark mode of the `GazePointer` story records: targets are lit one at a time, the user
// looks at the lit one, and every rendered frame is written down with what the pointer made of it.
//
// Pure functions on plain numbers: no three.js, no React, no DOM.
//
// The three measures
// ------------------
//
//   1. `correctShare`: the share of the time the lit target was the elected one.
//   2. `changesPer10s`: how many times the elected target changed per 10 seconds while a target was lit. Any change
//      counts, losing the target (to nothing) and getting it back included: each is an event sent to the scene.
//   3. `medianError`: the median angle, in visual degrees, between the gaze point and the centre of the lit target.
//
// What is measured, and what is left out
// --------------------------------------
//
//   - A lit period is a run of consecutive frames with the same lit target.
//   - The eyes need time to travel to a target that has just lit up, and the pointer needs time to follow. The frames
//     of the first `settle` milliseconds of each lit period are left out of the three measures (750 ms by default).
//     The score says which settling time it was computed with.
//   - Time is measured between consecutive settled frames of the same lit period: a frame stands for the time until
//     the next one. The change of elected target that comes with a new lit target is therefore never counted.
//   - A frame without a gaze point (a blink, a lost face, a gaze off the screen) stays in the first two measures: what
//     matters there is the elected target, which the pointer may rightly hold through a blink, or wrongly lose. It has
//     no error to give and is left out of the third; the score says how many such frames there were.
//   - Frames during which no target is lit are ignored.
//

import type { GazeCalibrationSample } from './GazePointer.calibration'
import { createGazePointerCore, type GazePointerCoreOptions, type GazePointerPick } from './GazePointer.core'
import {
  gazePixelsToDegrees,
  gazeToScreen,
  type GazeCalibration,
  type GazeDetection,
  type GazeScreen,
} from './GazePointer.model'
import { closestGazeHit, gazeRayBundle, type GazeRayHit } from './GazePointer.pick'

//
// Types
//

/** A target of the benchmark: a rectangle of the screen, in screen pixels (origin at the top left corner, +y down). */
export type GazeBenchmarkTarget = {
  /** What the frames call this target. */
  id: string
  left: number
  top: number
  width: number
  height: number
}

/** One rendered frame of a session, as the pointer saw it. */
export type GazeBenchmarkFrame = {
  /** Timestamp of the frame, in milliseconds. Frames are in chronological order. */
  time: number
  /** The `id` of the target lit during this frame, `null` when none is. */
  lit: string | null
  /** The `id` of the target the pointer had elected, `null` when it had none. */
  elected: string | null
  /** The filtered gaze point in screen pixels, `null` without one. */
  point: { x: number; y: number } | null
  /** Distance between the eyes and the gaze point, in centimetres, `null` when it is not known. */
  distance: number | null
}

/** What `scoreGazeBenchmark` needs of a session. */
export type GazeBenchmarkRecording = {
  /** Size of the physical screen in CSS pixels. With `calibration`, it converts pixels to visual degrees. */
  screen: GazeScreen
  /** The calibration the pointer ran with. Only the width of the screen is read. Default: the priors. */
  calibration?: GazeCalibration
  /** Where each target was on the screen. */
  targets: ReadonlyArray<GazeBenchmarkTarget>
  /** The frames, in chronological order. */
  frames: ReadonlyArray<GazeBenchmarkFrame>
}

/** Options of `scoreGazeBenchmark`. */
export type GazeBenchmarkScoreOptions = {
  /**
   * How long after a target lights up its frames are left out of the measures, in milliseconds.
   * Default: `GAZE_BENCHMARK_SETTLE`
   */
  settle?: number
}

/** The score of a session. See the header of this file for what is measured and what is left out. */
export type GazeBenchmarkScore = {
  /** Share of the measured time the lit target was the elected one, from 0 to 1. `null` when no time was measured. */
  correctShare: number | null
  /** Changes of the elected target per 10 seconds of measured time. `null` when no time was measured. */
  changesPer10s: number | null
  /**
   * Median angle between the gaze point and the centre of the lit target, in visual degrees. `null` when no measured
   * frame had a gaze point.
   */
  medianError: number | null
  /** The settling time left out after each target lit up, in milliseconds. */
  settle: number
  /** The time the first two measures were taken over, in milliseconds. */
  scoredTime: number
  /** How many frames were measured. */
  frames: number
  /** How many of them had no gaze point: they are in the first two measures and not in the error. */
  framesWithoutPoint: number
}

//
// Constants
//

/** The default settling time: how long after a target lights up its frames are left out of the score, in ms. */
export const GAZE_BENCHMARK_SETTLE = 750

//
// Scoring
//

/**
 * Scores a benchmark session: how often the pointer elected the target the user was asked to look at, how steady the
 * election was, and how far the gaze point was from the target.
 *
 * @param recording The frames of the session, where its targets were, and what converts pixels to degrees.
 * @param options The settling time.
 * @returns The three measures and what they were taken over.
 */
export function scoreGazeBenchmark(
  recording: GazeBenchmarkRecording,
  options: GazeBenchmarkScoreOptions = {}
): GazeBenchmarkScore {
  const settle = options.settle ?? GAZE_BENCHMARK_SETTLE
  const { frames, screen, calibration } = recording

  const centers = new Map<string, { x: number; y: number }>()
  for (const target of recording.targets) {
    centers.set(target.id, { x: target.left + target.width / 2, y: target.top + target.height / 2 })
  }

  let scoredTime = 0
  let correctTime = 0
  let changes = 0
  let scoredFrames = 0
  let framesWithoutPoint = 0
  const errors: number[] = []

  /** When the lit period of the current frame started */
  let periodStart = 0

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    const previous = frames[i - 1]
    if (!previous || previous.lit !== frame.lit) periodStart = frame.time

    if (frame.lit === null || frame.time - periodStart < settle) continue
    scoredFrames++

    // the error of the frame
    const center = centers.get(frame.lit)
    if (frame.point === null) {
      framesWithoutPoint++
    } else if (center && frame.distance !== null) {
      const pixels = Math.hypot(frame.point.x - center.x, frame.point.y - center.y)
      errors.push(gazePixelsToDegrees(pixels, frame.distance, calibration, { screen }))
    }

    // the time until the next frame of the same lit period
    const next = frames[i + 1]
    if (!next || next.lit !== frame.lit) continue
    const duration = next.time - frame.time
    scoredTime += duration
    if (frame.elected === frame.lit) correctTime += duration
    if (next.elected !== frame.elected) changes++
  }

  return {
    correctShare: scoredTime > 0 ? correctTime / scoredTime : null,
    changesPer10s: scoredTime > 0 ? (changes / scoredTime) * 10000 : null,
    medianError: median(errors),
    settle,
    scoredTime,
    frames: scoredFrames,
    framesWithoutPoint,
  }
}

//
// The order targets are lit in
//

/**
 * The order in which the targets of a session are lit: `rounds` rounds, each going through every target once in a
 * random order. Every target is therefore lit `rounds` times, and never twice in a row.
 *
 * @param targets Number of targets.
 * @param rounds Number of times each target is lit.
 * @param seed Seed of the pseudo-random order: the same seed gives the same order.
 * @returns The index of the target to light, for each lit period.
 */
export function gazeBenchmarkSequence(targets: number, rounds: number, seed: number): number[] {
  const random = mulberry32(seed)
  const sequence: number[] = []

  for (let round = 0; round < rounds; round++) {
    // Fisher-Yates shuffle
    const order = Array.from({ length: targets }, (_, index) => index)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }

    // the round must not start with the target the previous one ended with
    if (order.length > 1 && order[0] === sequence[sequence.length - 1]) {
      ;[order[0], order[1]] = [order[1], order[0]]
    }

    sequence.push(...order)
  }

  return sequence
}

//
// Recording a session
//

/**
 * A raw detection as a session stores it: the numbers the gaze model can read, rounded, without their names. The
 * names are stored once for the whole session, in `GazeBenchmarkSession.detectionLayout`.
 */
export type GazeBenchmarkDetection = {
  /** The head transformation matrix: 16 numbers, column-major, centimetres. Rounded to 5 decimals. */
  matrix: number[]
  /** The blendshape scores, in the order of `detectionLayout.blendshapes`. Rounded to 4 decimals. */
  blendshapes: number[]
  /**
   * The landmarks listed by `detectionLayout.landmarks`, flattened: `x`, `y`, `z` of the first, then of the second...
   * Normalised to the video, as MediaPipe gives them. Rounded to 5 decimals.
   */
  landmarks: number[]
}

/** A frame of a recorded session: what the pointer made of it, and the raw detection it was computed from. */
export type GazeBenchmarkRecordedFrame = GazeBenchmarkFrame & {
  /**
   * Index, in `GazeBenchmarkSession.detections`, of the latest detection when the frame was rendered. Several frames
   * share one detection when the page renders faster than the webcam. `null`: no detection, or no face in it.
   */
  detection: number | null
}

/** The settings the pointer ran with during a session. An absent field is the default of the pointer. */
export type GazeBenchmarkOptions = Pick<
  GazePointerCoreOptions,
  'eyeSignal' | 'tolerance' | 'voteWindow' | 'blinkGrace' | 'blinkThreshold' | 'filter' | 'aspect'
> & {
  /** Number of rays cast over the tolerance disc. Default: 7 */
  rays?: number
}

/**
 * A benchmark session, as exported to JSON by the `GazePointer` story: everything needed to score it again, and to
 * run the pointer again over its raw detections with other settings (`replayGazeBenchmark`).
 *
 * Pixels are CSS pixels of the physical screen (origin at its top left corner, +y down) unless stated otherwise.
 */
export type GazeBenchmarkSession = {
  /** Version of this format: `GAZE_BENCHMARK_VERSION`. */
  version: number
  /** When the session was recorded: an ISO 8601 date. */
  recordedAt: string
  /** Size of the physical screen. */
  screen: GazeScreen
  /** Where the page sat on the screen: the top left corner of its layout viewport, as `getGazeViewport()` told. */
  viewport: { x: number; y: number }
  /** The rectangle of the canvas on the screen. */
  canvas: { left: number; top: number; width: number; height: number }
  /** The calibration the pointer ran with. */
  calibration: GazeCalibration
  /**
   * The samples the calibration was solved from, empty when it was not made during the session. They hold the raw
   * signal, so the calibration can be solved again for another eye signal (`solveGazeCalibration`).
   */
  calibrationSamples: GazeCalibrationSample[]
  /** The settings the pointer ran with. */
  options: GazeBenchmarkOptions
  /** How long each target stayed lit, in milliseconds. */
  litDuration: number
  /** Seed of the order the targets were lit in (`gazeBenchmarkSequence`). */
  seed: number
  /** Where each target was on the screen. */
  targets: GazeBenchmarkTarget[]
  /** What the numbers of a `GazeBenchmarkDetection` stand for. */
  detectionLayout: {
    /** The index, among the 478 landmarks of MediaPipe, of each stored landmark. */
    landmarks: number[]
    /** The name of each stored blendshape. */
    blendshapes: string[]
  }
  /** The raw detections, in the order they came. */
  detections: GazeBenchmarkDetection[]
  /** The rendered frames, in chronological order. Times are in milliseconds since the first target lit up. */
  frames: GazeBenchmarkRecordedFrame[]
}

/** What a recorder is created with: what is known of the session before its first frame. */
export type GazeBenchmarkSetup = Omit<GazeBenchmarkSession, 'version' | 'detectionLayout' | 'detections' | 'frames'> & {
  /**
   * Which landmarks of each detection are stored:
   * - `eyes`: the irises and the contours of the two eyes (`GAZE_BENCHMARK_EYE_LANDMARKS`), about 1.3 kB per
   *   detection. It is all the gaze model reads.
   * - `all`: the 478 landmarks, about 11 kB per detection.
   *
   * Default: `eyes`
   */
  landmarks?: 'eyes' | 'all'
}

/** A session recorder, as returned by `createGazeBenchmarkRecorder`. */
export type GazeBenchmarkRecorder = {
  /**
   * Writes one rendered frame down. Call it once per frame, after the pointer has run.
   *
   * @param frame What the pointer made of the frame (see `GazeBenchmarkFrame`), and `detection`, the latest raw
   * MediaPipe detection (`undefined` when there is none). A detection handed to several frames in a row is stored
   * once: detections are told apart by identity.
   */
  record(frame: GazeBenchmarkFrame & { detection: GazeDetection | undefined }): void
  /** The session recorded so far: a plain object, ready for `JSON.stringify`. */
  finish(): GazeBenchmarkSession
}

/** Version of the session format. */
export const GAZE_BENCHMARK_VERSION = 1

/**
 * The landmarks stored by default: for each eye, the centre of the iris and the four points around it, then the
 * sixteen points of the contour of the eye (`FACEMESH_IRISES`, `FACEMESH_LEFT_EYE` and `FACEMESH_RIGHT_EYE` of
 * MediaPipe). "Left" and "right" are those of the user.
 */
export const GAZE_BENCHMARK_EYE_LANDMARKS: ReadonlyArray<number> = /* @__PURE__ */ Object.freeze([
  // right iris, left iris
  468, 469, 470, 471, 472, 473, 474, 475, 476, 477,
  // contour of the right eye
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
  // contour of the left eye
  263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466,
])

/** The number of landmarks of a MediaPipe face. */
const LANDMARKS = 478

/**
 * Creates the recorder of a benchmark session.
 *
 * It owns the format of the export: it rounds the numbers (a tenth of a millisecond, a tenth of a pixel, a tenth of a
 * millimetre; see `GazeBenchmarkDetection` for the detections) and stores each raw detection once.
 *
 * @param setup What is known of the session before its first frame, written to the session as it is.
 */
export function createGazeBenchmarkRecorder(setup: GazeBenchmarkSetup): GazeBenchmarkRecorder {
  const { landmarks = 'eyes', ...header } = setup

  const layout: GazeBenchmarkSession['detectionLayout'] = {
    landmarks:
      landmarks === 'all' ? Array.from({ length: LANDMARKS }, (_, index) => index) : [...GAZE_BENCHMARK_EYE_LANDMARKS],
    blendshapes: [],
  }
  const detections: GazeBenchmarkDetection[] = []
  const frames: GazeBenchmarkRecordedFrame[] = []

  /** The latest detection handed to `record`, and where it was stored */
  let lastDetection: GazeDetection | undefined = undefined
  let lastIndex: number | null = null

  function store(detection: GazeDetection | undefined): number | null {
    if (detection === lastDetection) return lastIndex
    lastDetection = detection

    const packed = detection ? packDetection(detection, layout) : null
    lastIndex = packed ? detections.push(packed) - 1 : null
    return lastIndex
  }

  return {
    record({ time, lit, elected, point, distance, detection }) {
      frames.push({
        time: round(time, 1),
        lit,
        elected,
        point: point && { x: round(point.x, 1), y: round(point.y, 1) },
        distance: distance === null ? null : round(distance, 2),
        detection: store(detection),
      })
    },
    finish() {
      return { version: GAZE_BENCHMARK_VERSION, ...header, detectionLayout: layout, detections, frames }
    },
  }
}

/**
 * The stored form of a detection, `null` when it has no face or no head matrix.
 * The names of the blendshapes are written to the layout by the first detection that has some.
 */
function packDetection(
  detection: GazeDetection,
  layout: GazeBenchmarkSession['detectionLayout']
): GazeBenchmarkDetection | null {
  const face = detection.faceLandmarks?.[0]
  const matrix = detection.facialTransformationMatrixes?.[0]?.data
  if (!face || !matrix) return null

  const categories = detection.faceBlendshapes?.[0]?.categories ?? []
  if (layout.blendshapes.length === 0) layout.blendshapes = categories.map((category) => category.categoryName)

  const scores = new Map<string, number>()
  for (const category of categories) scores.set(category.categoryName, category.score)

  const landmarks: number[] = []
  for (const index of layout.landmarks) {
    const landmark = face[index]
    landmarks.push(round(landmark?.x ?? 0, 5), round(landmark?.y ?? 0, 5), round(landmark?.z ?? 0, 5))
  }

  return {
    matrix: Array.from(matrix, (value) => round(value, 5)),
    blendshapes: categories.length > 0 ? layout.blendshapes.map((name) => round(scores.get(name) ?? 0, 4)) : [],
    landmarks,
  }
}

/** The detection a stored one stands for. The landmarks that were not stored are missing from it. */
function unpackDetection(
  packed: GazeBenchmarkDetection,
  layout: GazeBenchmarkSession['detectionLayout']
): GazeDetection {
  const face = new Array<{ x: number; y: number; z: number }>(LANDMARKS)
  layout.landmarks.forEach((index, i) => {
    face[index] = { x: packed.landmarks[i * 3], y: packed.landmarks[i * 3 + 1], z: packed.landmarks[i * 3 + 2] }
  })

  const detection: GazeDetection = {
    faceLandmarks: [face],
    facialTransformationMatrixes: [{ data: packed.matrix }],
  }
  if (packed.blendshapes.length > 0) {
    const categories = layout.blendshapes.map((categoryName, i) => ({ categoryName, score: packed.blendshapes[i] }))
    detection.faceBlendshapes = [{ categories }]
  }

  return detection
}

//
// Replaying a session
//

/**
 * What to replay a session with. An absent field is what the session was recorded with; a field set to `undefined`
 * is the default of the pointer.
 */
export type GazeBenchmarkReplayOptions = GazeBenchmarkOptions &
  GazeBenchmarkScoreOptions & {
    /** The calibration to run the pointer under. */
    calibration?: GazeCalibration
  }

/**
 * Runs the pointer again over the raw detections of a recorded session, and scores what it elects.
 *
 * Each frame of the session is fed to a new pointer core, at its recorded time, with the detection it had. The pick
 * function is rebuilt from the recorded layout, the way the component picks: a bundle of rays over the tolerance
 * disc, each ray stopping at the target whose rectangle it falls in, the hit closest to the centre winning; a gaze
 * outside the canvas picks nothing.
 *
 * With no option it runs the pointer as it was recorded. The score can still differ a little from the one of the
 * recorded frames: the detections are rounded in a session, and the pointer starts afresh on the first frame.
 *
 * @param session A session, as exported by the story.
 * @param options What to run the pointer with instead of what was recorded: eye signal, filter, tolerance, vote
 * window, calibration..., and the settling time of the score.
 * @returns The score of the replayed session.
 */
export function replayGazeBenchmark(
  session: GazeBenchmarkSession,
  options: GazeBenchmarkReplayOptions = {}
): GazeBenchmarkScore {
  const { settle, calibration, rays, eyeSignal, aspect, ...pointer } = {
    calibration: session.calibration,
    ...session.options,
    ...options,
  }
  const { screen, targets } = session
  const modelOptions = { eyeSignal, aspect, screen }

  const core = createGazePointerCore<GazeBenchmarkTarget>({ ...pointer, ...modelOptions, calibration, dwell: false })
  const pick = createPick(session, rays ?? 7)
  const detections = session.detections.map((packed) => unpackDetection(packed, session.detectionLayout))

  /** Distance between the eyes and the latest gaze point */
  let distance: number | null = null

  const frames = session.frames.map((recorded): GazeBenchmarkFrame => {
    const detection = recorded.detection === null ? undefined : detections[recorded.detection]
    const frame = core.update(detection, recorded.time, pick)

    const onScreen = detection && gazeToScreen(detection, calibration, modelOptions)
    if (onScreen) distance = onScreen.distance

    return {
      time: recorded.time,
      lit: recorded.lit,
      elected: frame.target === null ? null : frame.target.id,
      point: frame.point,
      distance: frame.point === null ? null : distance,
    }
  })

  return scoreGazeBenchmark({ screen, calibration, targets, frames }, { settle })
}

/** The pick function over the recorded layout of a session. */
function createPick(session: GazeBenchmarkSession, rays: number): GazePointerPick<GazeBenchmarkTarget> {
  const { canvas, targets } = session
  const bundle = gazeRayBundle(rays)

  const inside = (rect: { left: number; top: number; width: number; height: number }, x: number, y: number) =>
    x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height

  return (point, radius) => {
    if (!inside(canvas, point.x, point.y)) return null

    const hits: GazeRayHit<GazeBenchmarkTarget, undefined>[] = []
    for (const ray of bundle) {
      const x = point.x + ray.x * radius
      const y = point.y + ray.y * radius
      if (!inside(canvas, x, y)) continue

      const target = targets.find((candidate) => inside(candidate, x, y))
      if (target) hits.push({ offset: Math.hypot(ray.x, ray.y), target, distance: 0, hit: undefined })
    }

    const closest = closestGazeHit(hits)
    return closest ? { target: closest.target } : null
  }
}

//
// Internals
//

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** A reproducible source of numbers between 0 and 1. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The median of numbers, `null` when there is none. */
function median(values: number[]): number | null {
  if (values.length === 0) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
