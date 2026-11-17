//
// Calibration solver: from samples (what the tracker saw while the user looked at known points of the screen) to the
// `GazeCalibration` that best explains them, with its residual error in visual degrees.
//
// Pure functions on plain numbers, on top of `GazePointer.model.ts` (frames and units are stated there).
//
// What is fitted, and why
// -----------------------
//
// The model has eleven numbers: eye gain (2), eye offset (2), screen offset (3), screen tilt (1), screen size (2) and
// webcam field of view (1). Five points give ten equations, and most of these numbers cannot be told apart from
// samples taken at one head position. The degeneracies, checked on the model:
//
//   - `eyes.offset` against `screen.offset` x and y: sliding the screen in its plane moves every gaze point by the
//     same length, and so does a constant angle added to the eyes, seen from one distance. Only the parallax between
//     two head positions separates them.
//   - `eyes.gain` against `screen.offset` z, `screen.size` and `webcam.fov`: a gaze point is, to first order,
//     `distance * angle * pixels per centimetre`. A gain, the distance of the screen (its z offset, or the depth of
//     the head, which the field of view rescales) and the size of the screen all multiply together. Between the gain
//     and the distance only the curvature of the tangent differs, which is far below the noise over the 15 degrees or
//     so that a screen covers. `screen.size` against the distance is exact along the width.
//   - `screen.tilt` against the pitch gain and offset and the screen height: a tilt mostly stretches and shifts the
//     vertical axis; what is left is a keystone effect of a few pixels.
//
// So the default fitted set is the per-user correction only: `eyes.gain` and `eyes.offset`, four numbers, well
// determined by five points (ten equations). At the head position of the calibration they also absorb an error on
// the geometry: a wrong screen offset ends up in the eye offset, a wrong distance, size or field of view in the gain.
// The geometry itself is kept as given in `options.start` (or its priors).
//
// The geometry can be fitted too, by naming it in `options.fit`, when the samples can tell it apart: `screen.offset`
// needs samples taken from at least two clearly different head positions. Fitting a parameter the samples cannot
// separate does not fail (the solver is damped and bounded), it only spreads the correction arbitrarily between the
// degenerate parameters, and predictions get worse away from the head position of the calibration.
//

import {
  gazePixelsToDegrees,
  gazeRay,
  gazeRayToScreen,
  getGazeScreen,
  resolveGazeCalibration,
  type GazeCalibration,
  type GazeDetection,
  type GazeModelOptions,
  type GazeScreen,
  type ResolvedGazeCalibration,
} from './GazePointer.model'

//
// Types
//

/** The eight `eyeLook*` blendshape scores the gaze model reads. "Left" and "right" are the eyes of the user. */
export type GazeEyeLookScores = {
  eyeLookInLeft: number
  eyeLookOutLeft: number
  eyeLookUpLeft: number
  eyeLookDownLeft: number
  eyeLookInRight: number
  eyeLookOutRight: number
  eyeLookUpRight: number
  eyeLookDownRight: number
}

/**
 * One calibration sample: a point of the screen the user was looking at, with the detection signal averaged over a
 * short window. Build it with `gazeCalibrationSample`.
 *
 * It holds the raw signal, not eye angles, so that the solver can run the model again under any calibration and with
 * either eye signal. A plain serialisable object.
 */
export type GazeCalibrationSample = {
  /** The point the user was looking at, in screen pixels (origin at the top left corner of the screen, +y down). */
  target: { x: number; y: number }
  /** The head transformation matrix (4x4, column-major, centimetres), averaged element by element. */
  matrix: number[]
  /** The averaged `eyeLook*` scores. Absent when no detection of the window had them. */
  blendshapes?: GazeEyeLookScores
  /** The averaged centres of the irises (landmarks 473 and 468), normalised to the video. Absent like `blendshapes`. */
  irises?: { left: { x: number; y: number }; right: { x: number; y: number } }
  /** How many detections were averaged. */
  count: number
}

/**
 * A group of calibration numbers the solver can fit:
 * - `eyes.gain` and `eyes.offset`: the per-user correction of the eye angles (two numbers each)
 * - `screen.offset`: the position of the screen relative to the webcam (three numbers)
 * - `screen.tilt`: the pitch of the webcam relative to the screen (one number)
 * - `screen.size`: the width and the height of the screen (two numbers)
 * - `webcam.fov`: the vertical field of view of the webcam (one number).
 */
export type GazeCalibrationParameter =
  | 'eyes.gain'
  | 'eyes.offset'
  | 'screen.offset'
  | 'screen.tilt'
  | 'screen.size'
  | 'webcam.fov'

/** Options of `solveGazeCalibration`: those of the model (eye signal, screen, video aspect), plus the solver's own. */
export type GazeCalibrationOptions = GazeModelOptions & {
  /**
   * The calibration the solver starts from, and keeps for everything it does not fit. Absent fields fall back to
   * their priors. Default: the priors alone.
   */
  start?: GazeCalibration
  /** What to fit. Default: `GAZE_CALIBRATION_DEFAULT_FIT`, the per-user correction of the eye angles. */
  fit?: ReadonlyArray<GazeCalibrationParameter>
  /** How many usable samples are needed. Default: `GAZE_CALIBRATION_MIN_SAMPLES`. */
  minSamples?: number
}

/**
 * What `solveGazeCalibration` returns.
 *
 * - `solved`: `calibration` is the fitted one and carries its `residual` in visual degrees; `fitted` lists what was
 *   adjusted, everything else comes from the starting calibration.
 * - `unchanged`: the samples could not be used; `calibration` is the starting calibration (the priors by default),
 *   as it was, and `reason` says why:
 *   - `too-few-samples`: fewer usable samples than the minimum, or fewer equations than numbers to fit
 *   - `degenerate-samples`: the targets do not spread over the screen (all at one point, or on one row or column),
 *     the signal does not move with them, or no finite solution was found.
 */
export type GazeCalibrationResult =
  | { status: 'solved'; calibration: ResolvedGazeCalibration; fitted: GazeCalibrationParameter[] }
  | { status: 'unchanged'; calibration: ResolvedGazeCalibration; reason: 'too-few-samples' | 'degenerate-samples' }

//
// Constants
//

/** The default number of usable samples the solver asks for: the five points of the intended calibration screen. */
export const GAZE_CALIBRATION_MIN_SAMPLES = 5

/**
 * What the solver fits by default: the per-user correction of the eye angles, the only part of a calibration that
 * samples taken from one head position determine (see the header of this file).
 */
export const GAZE_CALIBRATION_DEFAULT_FIT: ReadonlyArray<GazeCalibrationParameter> = /* @__PURE__ */ Object.freeze([
  'eyes.gain',
  'eyes.offset',
] as const)

/** Every group that can be fitted, in the order their numbers are laid out in the solver. */
const PARAMETERS: ReadonlyArray<GazeCalibrationParameter> = [
  'eyes.gain',
  'eyes.offset',
  'screen.offset',
  'screen.tilt',
  'screen.size',
  'webcam.fov',
]

const EYE_LOOK_NAMES = [
  'eyeLookInLeft',
  'eyeLookOutLeft',
  'eyeLookUpLeft',
  'eyeLookDownLeft',
  'eyeLookInRight',
  'eyeLookOutRight',
  'eyeLookUpRight',
  'eyeLookDownRight',
] as const

/** The landmarks at the centre of each iris, as in the model. */
const IRIS_LEFT = 473
const IRIS_RIGHT = 468

/**
 * The targets must cover at least this fraction of the width and of the height of the screen, and so must the gaze
 * points the starting calibration predicts for the samples.
 */
const MIN_TARGET_SPREAD = 0.05

/** Upper bound of the steps the solver tries, accepted or not. */
const MAX_STEPS = 200

//
// Samples
//

/**
 * Averages a window of detections into one calibration sample.
 *
 * Detections without a face or without a head matrix are skipped (a blink, a lost face). The matrix is averaged
 * element by element, which is sound for the small jitter of a fixation and not for a head that turns during the
 * window. The eye signals are averaged over the detections that carry them.
 *
 * @param target The point the user was looking at, in screen pixels (origin at the top left corner, +y down).
 * @param detections Raw MediaPipe detection results collected while the user looked at the target.
 * @returns The sample, or `null` when no detection of the window can be used.
 */
export function gazeCalibrationSample(
  target: { x: number; y: number },
  detections: ReadonlyArray<GazeDetection>
): GazeCalibrationSample | null {
  const matrix = new Array<number>(16).fill(0)
  let count = 0

  const scores = EYE_LOOK_NAMES.map(() => 0)
  let scoresCount = 0

  const irises = [0, 0, 0, 0] // left x, left y, right x, right y
  let irisesCount = 0

  for (const detection of detections) {
    const data = detection.facialTransformationMatrixes?.[0]?.data
    const landmarks = detection.faceLandmarks?.[0]
    if (!landmarks || !data || data.length < 16) continue
    if (!allFinite(data.slice(0, 16))) continue

    for (let i = 0; i < 16; i++) matrix[i] += data[i]
    count++

    const eyeLook = readEyeLookScores(detection)
    if (eyeLook) {
      for (let i = 0; i < eyeLook.length; i++) scores[i] += eyeLook[i]
      scoresCount++
    }

    const left = landmarks[IRIS_LEFT]
    const right = landmarks[IRIS_RIGHT]
    if (left && right && allFinite([left.x, left.y, right.x, right.y])) {
      irises[0] += left.x
      irises[1] += left.y
      irises[2] += right.x
      irises[3] += right.y
      irisesCount++
    }
  }

  if (count === 0) return null

  const sample: GazeCalibrationSample = {
    target: { x: target.x, y: target.y },
    matrix: matrix.map((value) => value / count),
    count,
  }
  if (scoresCount > 0) {
    sample.blendshapes = {
      eyeLookInLeft: scores[0] / scoresCount,
      eyeLookOutLeft: scores[1] / scoresCount,
      eyeLookUpLeft: scores[2] / scoresCount,
      eyeLookDownLeft: scores[3] / scoresCount,
      eyeLookInRight: scores[4] / scoresCount,
      eyeLookOutRight: scores[5] / scoresCount,
      eyeLookUpRight: scores[6] / scoresCount,
      eyeLookDownRight: scores[7] / scoresCount,
    }
  }
  if (irisesCount > 0) {
    sample.irises = {
      left: { x: irises[0] / irisesCount, y: irises[1] / irisesCount },
      right: { x: irises[2] / irisesCount, y: irises[3] / irisesCount },
    }
  }

  return sample
}

/** The eight `eyeLook*` scores of a detection, in the order of `EYE_LOOK_NAMES`, or `null` when one is missing. */
function readEyeLookScores(detection: GazeDetection): number[] | null {
  const categories = detection.faceBlendshapes?.[0]?.categories
  if (!categories) return null

  const scores: number[] = []
  for (const name of EYE_LOOK_NAMES) {
    const category = categories.find((candidate) => candidate.categoryName === name)
    if (!category || !Number.isFinite(category.score)) return null
    scores.push(category.score)
  }

  return scores
}

/** Rebuilds, from a sample, the smallest detection the model can read. */
function sampleToDetection(sample: GazeCalibrationSample): GazeDetection {
  const landmarks: { x: number; y: number; z: number }[] = []
  if (sample.irises) {
    for (let i = 0; i <= IRIS_LEFT; i++) landmarks.push({ x: 0, y: 0, z: 0 })
    landmarks[IRIS_LEFT] = { x: sample.irises.left.x, y: sample.irises.left.y, z: 0 }
    landmarks[IRIS_RIGHT] = { x: sample.irises.right.x, y: sample.irises.right.y, z: 0 }
  }

  const blendshapes = sample.blendshapes
  const categories = blendshapes
    ? EYE_LOOK_NAMES.map((categoryName) => ({ categoryName, score: blendshapes[categoryName] }))
    : null

  return {
    faceLandmarks: [landmarks],
    faceBlendshapes: categories ? [{ categories }] : [],
    facialTransformationMatrixes: [{ data: sample.matrix }],
  }
}

//
// Solver
//

/**
 * Finds the calibration that best explains calibration samples.
 *
 * It starts from `options.start` (the priors by default) and adjusts the numbers named by `options.fit` so that the
 * model, run on the signal of each sample, lands on its target. By default it fits the per-user correction of the eye
 * angles (`eyes.gain` and `eyes.offset`) and keeps the geometry of the screen and of the webcam as given: see the
 * header of this file for what samples can and cannot tell apart.
 *
 * It is deterministic, runs a bounded number of steps, never throws and never returns a number that is not finite.
 *
 * Pass the same `eyeSignal`, `screen` and `aspect` as the ones the pointer runs with.
 *
 * @param samples Samples built by `gazeCalibrationSample`, five or more, spread over the screen.
 * @param options The starting calibration, what to fit, and the options of the model.
 * @returns `solved` with the fitted calibration and its `residual` in visual degrees (the root mean square, over the
 * samples, of the angle between the predicted gaze point and the target, as seen by the user), or `unchanged` with
 * the starting calibration and the reason.
 */
export function solveGazeCalibration(
  samples: ReadonlyArray<GazeCalibrationSample>,
  options: GazeCalibrationOptions = {}
): GazeCalibrationResult {
  const screen = options.screen ?? getGazeScreen()
  const modelOptions: GazeModelOptions = { eyeSignal: options.eyeSignal, aspect: options.aspect, screen }
  const start = copyCalibration(resolveGazeCalibration(options.start, screen))
  const requested = options.fit ?? GAZE_CALIBRATION_DEFAULT_FIT
  const fitted = PARAMETERS.filter((parameter) => requested.includes(parameter))
  const minSamples = options.minSamples ?? GAZE_CALIBRATION_MIN_SAMPLES

  // Keep the samples the model can read under the starting calibration.
  const usable: UsableSample[] = []
  for (const sample of samples) {
    const usableSample = toUsableSample(sample)
    if (usableSample && predict(usableSample, start, modelOptions)) usable.push(usableSample)
  }

  const startValues = readParameters(start, fitted)
  if (usable.length < minSamples || usable.length * 2 < startValues.length || fitted.length === 0) {
    return { status: 'unchanged', calibration: start, reason: 'too-few-samples' }
  }
  // The targets must spread over the screen, and so must the signal: what the starting calibration makes of it.
  const startPoints = usable.map((sample) => predict(sample, start, modelOptions) ?? sample.target)
  const targets = usable.map((sample) => sample.target)
  if (!spreadOverScreen(targets, screen) || !spreadOverScreen(startPoints, screen)) {
    return { status: 'unchanged', calibration: start, reason: 'degenerate-samples' }
  }

  // The errors to minimise: for each sample, how far the predicted point is from the target, in pixels, along x and y.
  const errors = (values: number[]): number[] | null => {
    const calibration = writeParameters(start, fitted, values)
    if (!calibration) return null

    const result: number[] = []
    for (const sample of usable) {
      const point = predict(sample, calibration, modelOptions)
      if (!point) return null
      result.push(point.x - sample.target.x, point.y - sample.target.y)
    }
    return result
  }

  const values = minimise(errors, startValues)
  const calibration = writeParameters(start, fitted, values)
  const residual = calibration && residualDegrees(usable, calibration, modelOptions)
  if (!calibration || residual === null) {
    return { status: 'unchanged', calibration: start, reason: 'degenerate-samples' }
  }

  calibration.residual = residual
  return { status: 'solved', calibration, fitted }
}

/** A sample with its detection rebuilt once. */
type UsableSample = { target: { x: number; y: number }; detection: GazeDetection }

function toUsableSample(sample: GazeCalibrationSample): UsableSample | null {
  if (!sample || !sample.target || !Array.isArray(sample.matrix)) return null
  if (!allFinite([sample.target.x, sample.target.y]) || sample.matrix.length < 16 || !allFinite(sample.matrix)) {
    return null
  }

  return { target: sample.target, detection: sampleToDetection(sample) }
}

/** Where the model puts the gaze of a sample on the plane of the screen, or `null` when it cannot tell. */
function predict(sample: UsableSample, calibration: ResolvedGazeCalibration, options: GazeModelOptions) {
  const ray = gazeRay(sample.detection, calibration, options)
  if (!ray) return null

  const point = gazeRayToScreen(ray, calibration, options)
  if (!point || !allFinite([point.x, point.y, point.distance])) return null

  return point
}

/** Whether points cover enough of the screen, along its width and along its height. */
function spreadOverScreen(points: ReadonlyArray<{ x: number; y: number }>, screen: GazeScreen): boolean {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const spreadX = Math.max(...xs) - Math.min(...xs)
  const spreadY = Math.max(...ys) - Math.min(...ys)

  return spreadX >= screen.width * MIN_TARGET_SPREAD && spreadY >= screen.height * MIN_TARGET_SPREAD
}

/**
 * The residual of a calibration: the root mean square, over the samples, of the visual angle between the predicted
 * point and the target. `null` when it cannot be computed.
 */
function residualDegrees(
  samples: UsableSample[],
  calibration: ResolvedGazeCalibration,
  options: GazeModelOptions
): number | null {
  let sum = 0
  for (const sample of samples) {
    const point = predict(sample, calibration, options)
    if (!point) return null

    const pixels = Math.hypot(point.x - sample.target.x, point.y - sample.target.y)
    const degrees = gazePixelsToDegrees(pixels, point.distance, calibration, options)
    sum += degrees * degrees
  }

  const residual = Math.sqrt(sum / samples.length)
  return Number.isFinite(residual) ? residual : null
}

//
// Calibration as a list of numbers
//

/** A copy made of fresh plain objects and arrays, so the result shares nothing with the presets or the input. */
function copyCalibration(calibration: ResolvedGazeCalibration): ResolvedGazeCalibration {
  const copy: ResolvedGazeCalibration = {
    screen: {
      width: calibration.screen.width,
      height: calibration.screen.height,
      offset: [calibration.screen.offset[0], calibration.screen.offset[1], calibration.screen.offset[2]],
      tilt: calibration.screen.tilt,
    },
    webcam: { fov: calibration.webcam.fov },
    eyes: {
      gain: [calibration.eyes.gain[0], calibration.eyes.gain[1]],
      offset: [calibration.eyes.offset[0], calibration.eyes.offset[1]],
    },
  }
  if (calibration.residual !== undefined) copy.residual = calibration.residual

  return copy
}

/** The numbers of the fitted groups, one after the other. */
function readParameters(calibration: ResolvedGazeCalibration, fitted: GazeCalibrationParameter[]): number[] {
  const values: number[] = []
  for (const parameter of fitted) {
    if (parameter === 'eyes.gain') values.push(...calibration.eyes.gain)
    if (parameter === 'eyes.offset') values.push(...calibration.eyes.offset)
    if (parameter === 'screen.offset') values.push(...calibration.screen.offset)
    if (parameter === 'screen.tilt') values.push(calibration.screen.tilt)
    if (parameter === 'screen.size') values.push(calibration.screen.width, calibration.screen.height)
    if (parameter === 'webcam.fov') values.push(calibration.webcam.fov)
  }
  return values
}

/**
 * The starting calibration with the numbers of the fitted groups replaced, without a residual.
 * `null` when the numbers do not make a calibration: not finite, an empty screen, an impossible field of view, or
 * a gain that is not positive (the eyes would turn against their signal).
 */
function writeParameters(
  start: ResolvedGazeCalibration,
  fitted: GazeCalibrationParameter[],
  values: number[]
): ResolvedGazeCalibration | null {
  if (!allFinite(values)) return null

  const { screen, webcam, eyes } = copyCalibration(start)
  const calibration: ResolvedGazeCalibration = { screen, webcam, eyes }

  let i = 0
  for (const parameter of fitted) {
    if (parameter === 'eyes.gain') eyes.gain = [values[i++], values[i++]]
    if (parameter === 'eyes.offset') eyes.offset = [values[i++], values[i++]]
    if (parameter === 'screen.offset') screen.offset = [values[i++], values[i++], values[i++]]
    if (parameter === 'screen.tilt') screen.tilt = values[i++]
    if (parameter === 'screen.size') {
      screen.width = values[i++]
      screen.height = values[i++]
    }
    if (parameter === 'webcam.fov') webcam.fov = values[i++]
  }

  if (!(screen.width > 0) || !(screen.height > 0)) return null
  if (!(webcam.fov > 0) || !(webcam.fov < 180)) return null
  if (!(Math.abs(screen.tilt) < 90)) return null
  if (!(eyes.gain[0] > 0) || !(eyes.gain[1] > 0)) return null

  return calibration
}

//
// Least squares
//

/**
 * Minimises the sum of the squares of `errors` with the Levenberg-Marquardt method and a numeric Jacobian.
 *
 * @param errors The errors for given values, or `null` where they cannot be computed. Not `null` at `start`.
 * @param start Where to start from.
 * @returns The best values found: `start` itself when nothing better was found. Always finite.
 */
function minimise(errors: (values: number[]) => number[] | null, start: number[]): number[] {
  const size = start.length

  let values = start.slice()
  let current = errors(values)
  if (!current) return values
  let cost = sumOfSquares(current)

  let damping = 1e-3
  let steps = 0

  while (steps < MAX_STEPS && cost > 0) {
    // The Jacobian, by central differences: how each error moves with each value.
    const jacobian: number[][] = []
    for (let column = 0; column < size; column++) {
      const step = 1e-6 * Math.max(1, Math.abs(values[column]))
      const forward = values.slice()
      const backward = values.slice()
      forward[column] += step
      backward[column] -= step

      const after = errors(forward)
      const before = errors(backward)
      jacobian.push(current.map((_, row) => (after && before ? (after[row] - before[row]) / (2 * step) : 0)))
    }

    // The normal equations: (JtJ + damping * diagonal) * move = -Jt * errors
    const normal: number[][] = []
    const gradient: number[] = []
    for (let a = 0; a < size; a++) {
      normal.push([])
      for (let b = 0; b < size; b++) normal[a].push(dot(jacobian[a], jacobian[b]))
      gradient.push(-dot(jacobian[a], current))
    }

    // Raise the damping until a move lowers the cost.
    let improved = false
    while (steps < MAX_STEPS && !improved) {
      steps++

      const damped = normal.map((row, a) => row.map((value, b) => (a === b ? value * (1 + damping) + 1e-12 : value)))
      const move = solveLinear(damped, gradient)
      const candidate = move && values.map((value, index) => value + move[index])
      const candidateErrors = candidate && errors(candidate)
      const candidateCost = candidateErrors ? sumOfSquares(candidateErrors) : Infinity

      if (candidate && candidateErrors && candidateCost < cost) {
        const gain = cost - candidateCost
        values = candidate
        current = candidateErrors
        cost = candidateCost
        damping = Math.max(damping / 5, 1e-12)
        improved = true
        // converged: the cost barely moves any more
        if (gain <= cost * 1e-12) return values
      } else {
        damping *= 5
        // the move has shrunk to nothing: this is as low as it gets
        if (damping > 1e12) return values
      }
    }
  }

  return values
}

/** Solves `matrix * x = vector` by Gaussian elimination with partial pivoting. `null` when the matrix is singular. */
function solveLinear(matrix: number[][], vector: number[]): number[] | null {
  const size = vector.length
  const rows = matrix.map((row, index) => [...row, vector[index]])

  for (let column = 0; column < size; column++) {
    let pivot = column
    for (let row = column + 1; row < size; row++) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row
    }
    if (!(Math.abs(rows[pivot][column]) > 1e-300)) return null
    ;[rows[column], rows[pivot]] = [rows[pivot], rows[column]]

    for (let row = column + 1; row < size; row++) {
      const factor = rows[row][column] / rows[column][column]
      for (let k = column; k <= size; k++) rows[row][k] -= factor * rows[column][k]
    }
  }

  const solution = new Array<number>(size).fill(0)
  for (let row = size - 1; row >= 0; row--) {
    let sum = rows[row][size]
    for (let k = row + 1; k < size; k++) sum -= rows[row][k] * solution[k]
    solution[row] = sum / rows[row][row]
  }

  return allFinite(solution) ? solution : null
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

function sumOfSquares(values: number[]): number {
  return dot(values, values)
}

function allFinite(values: ReadonlyArray<number>): boolean {
  for (const value of values) {
    if (!Number.isFinite(value)) return false
  }
  return true
}
