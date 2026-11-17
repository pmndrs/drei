import { describe, expect, it } from 'vitest'
import {
  GAZE_CALIBRATION_DEFAULT_FIT,
  gazeCalibrationSample,
  solveGazeCalibration,
  type GazeCalibrationOptions,
  type GazeCalibrationSample,
} from './GazePointer.calibration'
import {
  gazePixelsToDegrees,
  gazeRay,
  gazeRayToScreen,
  resolveGazeCalibration,
  type GazeCalibration,
  type GazeEyeSignal,
} from './GazePointer.model'
import { synthesizeGaze, type SyntheticGazeInput } from './GazePointer.model.test-utils'

const desk = { width: 1920, height: 1080 }
const aspect = 16 / 9
const signals = ['blendshapes', 'iris'] as const

/** The geometry of a laptop, known to the app: the solver is given it as its starting calibration. */
const geometry = {
  screen: { width: 34.5, height: 21.5, offset: [0.4, -0.8, 0.2], tilt: 6 },
  webcam: { fov: 52 },
} as const

/** The user: the true calibration, which the solver has to find from the geometry. */
const truth = { ...geometry, eyes: { gain: [0.8, 1.3], offset: [2, -3] } } as const

/** The five points of a calibration screen: the middle and the four corners, away from the border. */
const fivePoints = [
  { x: 960, y: 540 },
  { x: 192, y: 108 },
  { x: 1728, y: 108 },
  { x: 192, y: 972 },
  { x: 1728, y: 972 },
]

/** Points that are not calibration points. */
const otherPoints = [
  { x: 480, y: 300 },
  { x: 1440, y: 300 },
  { x: 960, y: 150 },
  { x: 700, y: 800 },
  { x: 1500, y: 700 },
  { x: 100, y: 540 },
  { x: 1820, y: 1000 },
]

const calibrationHead = { position: [0, -12, -55] } as const
const otherHead = { position: [9, -8, -72], rotation: [-6, 4, 3] } as const

type Head = SyntheticGazeInput['head']
type Noise = { blendshapes: number; landmarks: number }

/**
 * What the tracker sees while a user described by `calibration` looks at each target: one sample per target, each
 * averaged over a window of `window` detections. Every detection has its own seed, so the noise is reproducible.
 */
function recordSamples(
  targets: { x: number; y: number }[],
  calibration: GazeCalibration,
  {
    head = calibrationHead as Head,
    noise,
    window = 1,
    seed = 1,
  }: { head?: Head; noise?: Noise; window?: number; seed?: number } = {}
): GazeCalibrationSample[] {
  return targets.map((target, index) => {
    const detections = Array.from({ length: window }, (_, frame) =>
      synthesizeGaze({
        target,
        calibration,
        screen: desk,
        aspect,
        head,
        noise: noise && { ...noise, seed: seed * 100000 + index * 1000 + frame },
      })
    )
    return gazeCalibrationSample(target, detections)!
  })
}

/**
 * The largest error, in visual degrees, of a solved calibration on noise-free faces of the true user looking at
 * `targets` from `head`.
 */
function worstError(
  solved: GazeCalibration,
  targets: { x: number; y: number }[],
  { user = truth as GazeCalibration, head = calibrationHead as Head, eyeSignal = 'blendshapes' as GazeEyeSignal } = {}
): number {
  const options = { eyeSignal, screen: desk, aspect }
  let worst = 0
  for (const target of targets) {
    const detection = synthesizeGaze({ target, calibration: user, screen: desk, aspect, head })
    const point = gazeRayToScreen(gazeRay(detection, solved, options)!, solved, options)!
    const pixels = Math.hypot(point.x - target.x, point.y - target.y)
    worst = Math.max(worst, gazePixelsToDegrees(pixels, point.distance, user, options))
  }
  return worst
}

function solve(samples: GazeCalibrationSample[], options: GazeCalibrationOptions = {}) {
  return solveGazeCalibration(samples, { start: geometry, screen: desk, aspect, ...options })
}

describe('gazeCalibrationSample', () => {
  const target = { x: 400, y: 300 }

  it('pairs the target with the signal of the one detection it is given', () => {
    const detection = synthesizeGaze({ target, screen: desk })

    const sample = gazeCalibrationSample(target, [detection])

    expect(sample?.target).toEqual(target)
    expect(sample?.count).toBe(1)
    expect(sample?.matrix).toEqual(detection.facialTransformationMatrixes?.[0].data)
    // the face looks to the left of the user and up: only these four scores are set by the generator
    const score = (name: string) => detection.faceBlendshapes![0].categories.find((c) => c.categoryName === name)!.score
    expect(sample?.blendshapes?.eyeLookOutLeft).toBe(score('eyeLookOutLeft'))
    expect(sample?.blendshapes?.eyeLookInLeft).toBe(0)
    expect(sample?.irises?.left.x).toBe(detection.faceLandmarks[0][473].x)
    expect(sample?.irises?.right.y).toBe(detection.faceLandmarks[0][468].y)
  })

  it('averages the signal over the window', () => {
    const near = synthesizeGaze({ target, screen: desk, head: { position: [0, -12, -50] } })
    const far = synthesizeGaze({ target, screen: desk, head: { position: [4, -12, -60] } })

    const sample = gazeCalibrationSample(target, [near, far])

    expect(sample?.count).toBe(2)
    // the translation of the head matrix: halfway between the two heads
    expect(sample?.matrix[12]).toBeCloseTo(2, 9)
    expect(sample?.matrix[14]).toBeCloseTo(-55, 9)
    const x = (detection: typeof near) => detection.faceLandmarks[0][473].x
    expect(sample?.irises?.left.x).toBeCloseTo((x(near) + x(far)) / 2, 12)
  })

  it('averages the noise away: a longer window is closer to the noise-free signal', () => {
    const clean = gazeCalibrationSample(target, [synthesizeGaze({ target, screen: desk })])!
    const noisy = (window: number) =>
      recordSamples([target], {}, { noise: { blendshapes: 0.05, landmarks: 0.002 }, window })[0]
    // the mean error over the eight scores; one noisy score is 0.05 * sqrt(2 / pi) = 0.04 off on average
    const error = (sample: GazeCalibrationSample) => {
      const [scores, cleanScores] = [Object.values(sample.blendshapes!), Object.values(clean.blendshapes!)]
      return scores.reduce((sum, score, index) => sum + Math.abs(score - cleanScores[index]) / scores.length, 0)
    }

    expect(error(noisy(1))).toBeGreaterThan(0.015)
    expect(error(noisy(100))).toBeLessThan(0.01)
  })

  it('skips the detections without a face, and returns nothing when none is left', () => {
    const empty = { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] }
    const detection = synthesizeGaze({ target, screen: desk })

    expect(gazeCalibrationSample(target, [empty, detection, empty])).toEqual(gazeCalibrationSample(target, [detection]))
    expect(gazeCalibrationSample(target, [empty])).toBeNull()
    expect(gazeCalibrationSample(target, [])).toBeNull()
  })

  it('gives a plain object that survives a JSON round trip', () => {
    const sample = recordSamples([target], truth, { window: 3 })[0]

    expect(JSON.parse(JSON.stringify(sample))).toEqual(sample)
  })
})

describe('solveGazeCalibration, five noise-free samples', () => {
  for (const eyeSignal of signals) {
    it(`${eyeSignal} signal: finds the correction of the user back, with a residual near zero`, () => {
      const result = solve(recordSamples(fivePoints, truth), { eyeSignal })

      expect(result.status).toBe('solved')
      expect(result.calibration.eyes.gain[0]).toBeCloseTo(0.8, 6)
      expect(result.calibration.eyes.gain[1]).toBeCloseTo(1.3, 6)
      expect(result.calibration.eyes.offset[0]).toBeCloseTo(2, 5)
      expect(result.calibration.eyes.offset[1]).toBeCloseTo(-3, 5)
      expect(result.calibration.residual).toBeLessThan(1e-6)
    })

    it(`${eyeSignal} signal: its predictions match the calibration targets`, () => {
      const result = solve(recordSamples(fivePoints, truth), { eyeSignal })

      expect(worstError(result.calibration, fivePoints, { eyeSignal })).toBeLessThan(1e-6)
    })

    it(`${eyeSignal} signal: its predictions hold on targets that were not calibration points`, () => {
      const result = solve(recordSamples(fivePoints, truth), { eyeSignal })

      expect(worstError(result.calibration, otherPoints, { eyeSignal })).toBeLessThan(1e-6)
    })

    it(`${eyeSignal} signal: its predictions hold from another head position`, () => {
      const result = solve(recordSamples(fivePoints, truth), { eyeSignal })

      const errors = [...fivePoints, ...otherPoints]
      expect(worstError(result.calibration, errors, { eyeSignal, head: otherHead })).toBeLessThan(1e-6)
    })
  }

  it('keeps what it does not fit as given, and says what it fitted', () => {
    const result = solve(recordSamples(fivePoints, truth))

    expect(result.status === 'solved' && result.fitted).toEqual(['eyes.gain', 'eyes.offset'])
    expect(GAZE_CALIBRATION_DEFAULT_FIT).toEqual(['eyes.gain', 'eyes.offset'])
    expect(result.calibration.screen).toEqual(geometry.screen)
    expect(result.calibration.webcam).toEqual(geometry.webcam)
  })

  it('starts from the priors when it is given no starting calibration', () => {
    const user = { eyes: { gain: [1.2, 0.9], offset: [-1.5, 2] } } as const
    const result = solveGazeCalibration(recordSamples(fivePoints, user), { screen: desk })

    const priors = resolveGazeCalibration(undefined, desk)
    expect(result.status).toBe('solved')
    expect(result.calibration.screen).toEqual(priors.screen)
    expect(result.calibration.webcam).toEqual(priors.webcam)
    expect(result.calibration.eyes.gain[0]).toBeCloseTo(1.2, 6)
    expect(result.calibration.eyes.offset[1]).toBeCloseTo(2, 5)
    expect(result.calibration.residual).toBeLessThan(1e-6)
  })

  it('returns a plain calibration that survives a JSON round trip', () => {
    const result = solve(recordSamples(fivePoints, truth))

    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
    expect(resolveGazeCalibration(JSON.parse(JSON.stringify(result.calibration)), desk)).toEqual(result.calibration)
  })

  it('gives the same answer every time', () => {
    const samples = recordSamples(fivePoints, truth, { noise: { blendshapes: 0.02, landmarks: 0.001 }, window: 5 })

    expect(solve(samples)).toEqual(solve(samples))
  })
})

describe('solveGazeCalibration, noisy samples', () => {
  // A noise of 0.02 on each blendshape score is about 1 degree on each eye angle of one detection; a window of 25
  // detections brings a sample down to about 0.2 degree per angle, 0.27 degree for the two together.
  const noise = { blendshapes: 0.02, landmarks: 0.0002 }
  const window = 25
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8]

  for (const eyeSignal of signals) {
    it(`${eyeSignal} signal: the residual follows the level of the noise`, () => {
      const residual = (level: number) => {
        let sum = 0
        for (const seed of seeds) {
          const scaled = { blendshapes: noise.blendshapes * level, landmarks: noise.landmarks * level }
          const result = solve(recordSamples(fivePoints, truth, { noise: scaled, window, seed }), { eyeSignal })
          expect(result.status).toBe('solved')
          sum += result.calibration.residual! / seeds.length
        }
        return sum
      }

      const [low, high] = [residual(1), residual(4)]
      // four numbers fitted on ten equations leave about sqrt(6 / 10) of the noise of a sample
      expect(low).toBeGreaterThan(0.08)
      expect(low).toBeLessThan(0.4)
      expect(high).toBeGreaterThan(low * 3)
      expect(high).toBeLessThan(low * 5)
    })

    it(`${eyeSignal} signal: predictions stay within the noise, on new targets and from another head position`, () => {
      for (const seed of seeds) {
        const result = solve(recordSamples(fivePoints, truth, { noise, window, seed }), { eyeSignal })

        // the noise of one sample is about 0.27 degree: the fit must not amplify it
        expect(worstError(result.calibration, fivePoints, { eyeSignal })).toBeLessThan(0.6)
        expect(worstError(result.calibration, otherPoints, { eyeSignal })).toBeLessThan(0.6)
        expect(worstError(result.calibration, otherPoints, { eyeSignal, head: otherHead })).toBeLessThan(0.6)
      }
    })
  }
})

describe('solveGazeCalibration, a geometry that is not the one it was given', () => {
  // The real screen is not the prior: the eye correction absorbs the difference where the user was calibrated.
  const user = {
    screen: { width: 34.5, height: 21.5, offset: [0.4, -2.5, 0.2], tilt: 6 },
    webcam: { fov: 58 },
    eyes: { gain: [0.9, 1.2], offset: [2, -3] },
  } as const
  const priors = { start: undefined }

  it('still improves on the priors, with a residual that tells the fit is not exact', () => {
    const samples = recordSamples(fivePoints, user)
    const result = solve(samples, priors)

    const before = worstError(resolveGazeCalibration(undefined, desk), otherPoints, { user })
    const after = worstError(result.calibration, otherPoints, { user })
    expect(result.status).toBe('solved')
    expect(before).toBeGreaterThan(5)
    expect(after).toBeLessThan(1)
    expect(result.calibration.residual).toBeGreaterThan(0.01)
    expect(result.calibration.residual).toBeLessThan(1)

    // away from the head position of the calibration the absorbed geometry shows, but it still beats the priors
    const beforeElsewhere = worstError(resolveGazeCalibration(undefined, desk), otherPoints, { user, head: otherHead })
    const afterElsewhere = worstError(result.calibration, otherPoints, { user, head: otherHead })
    expect(afterElsewhere).toBeGreaterThan(after)
    expect(afterElsewhere).toBeLessThan(beforeElsewhere / 2)
  })

  it('finds the offset of the screen when asked to, from samples taken at two head positions', () => {
    const shifted = { ...truth, screen: { ...truth.screen, offset: [1.5, -3, 1] } } as const
    const nearHead = { position: [-6, -10, -42] } as const
    const farHead = { position: [8, -14, -78] } as const
    const samples = [
      ...recordSamples(fivePoints, shifted, { head: nearHead }),
      ...recordSamples(fivePoints, shifted, { head: farHead }),
    ]

    const result = solve(samples, { fit: ['screen.offset', 'eyes.offset', 'eyes.gain'] })

    expect(result.status === 'solved' && result.fitted).toEqual(['eyes.gain', 'eyes.offset', 'screen.offset'])
    expect(result.calibration.screen.offset[0]).toBeCloseTo(1.5, 4)
    expect(result.calibration.screen.offset[1]).toBeCloseTo(-3, 4)
    expect(result.calibration.screen.offset[2]).toBeCloseTo(1, 4)
    expect(result.calibration.eyes.gain[0]).toBeCloseTo(0.8, 5)
    expect(result.calibration.residual).toBeLessThan(1e-5)
    expect(worstError(result.calibration, otherPoints, { user: shifted, head: otherHead })).toBeLessThan(1e-4)
  })

  it('stays finite when asked to fit what one head position cannot tell apart', () => {
    const result = solve(recordSamples(fivePoints, user), {
      ...priors,
      fit: ['eyes.gain', 'eyes.offset', 'screen.offset', 'screen.tilt', 'screen.size', 'webcam.fov'],
    })

    // eleven numbers on ten equations
    expect(result).toMatchObject({ status: 'unchanged', reason: 'too-few-samples' })

    const tenEquations = solve(recordSamples(fivePoints, user), {
      ...priors,
      fit: ['eyes.gain', 'eyes.offset', 'screen.offset', 'screen.tilt', 'screen.size'],
    })
    expect(tenEquations.status).toBe('solved')
    expect(JSON.stringify(tenEquations)).not.toMatch(/null|NaN/)
    expect(worstError(tenEquations.calibration, fivePoints, { user })).toBeLessThan(0.5)
  })
})

describe('solveGazeCalibration, samples it cannot use', () => {
  const start = resolveGazeCalibration(geometry, desk)

  it('returns the starting calibration unchanged with fewer samples than the minimum', () => {
    for (const count of [0, 1, 4]) {
      const result = solve(recordSamples(fivePoints.slice(0, count), truth))

      expect(result).toEqual({ status: 'unchanged', reason: 'too-few-samples', calibration: start })
    }
  })

  it('returns the priors unchanged when it is given no starting calibration', () => {
    const result = solveGazeCalibration([], { screen: desk })

    expect(result).toEqual({
      status: 'unchanged',
      reason: 'too-few-samples',
      calibration: resolveGazeCalibration(undefined, desk),
    })
  })

  it('takes a smaller minimum when asked to', () => {
    const result = solve(recordSamples(fivePoints.slice(0, 3), truth), { minSamples: 3 })

    expect(result.status).toBe('solved')
    expect(result.calibration.residual).toBeLessThan(1e-6)
  })

  it('returns the starting calibration unchanged when every sample is at the same point', () => {
    const samePoint = Array.from({ length: 6 }, () => ({ x: 960, y: 540 }))
    const result = solve(recordSamples(samePoint, truth, { noise: { blendshapes: 0.01, landmarks: 0.0005 } }))

    expect(result).toEqual({ status: 'unchanged', reason: 'degenerate-samples', calibration: start })
  })

  it('returns the starting calibration unchanged when the targets are all on one row or one column', () => {
    const row = [200, 500, 960, 1400, 1700].map((x) => ({ x, y: 540 }))
    const column = [100, 300, 540, 800, 1000].map((y) => ({ x: 960, y }))

    expect(solve(recordSamples(row, truth))).toMatchObject({ status: 'unchanged', reason: 'degenerate-samples' })
    expect(solve(recordSamples(column, truth))).toMatchObject({ status: 'unchanged', reason: 'degenerate-samples' })
  })

  it('does not count the samples the model cannot read', () => {
    const samples = recordSamples(fivePoints, truth)
    const broken: GazeCalibrationSample[] = [
      { ...samples[0], matrix: [] },
      { ...samples[1], matrix: samples[1].matrix.map(() => NaN) },
      { ...samples[2], target: { x: NaN, y: 0 } },
      { ...samples[3], blendshapes: undefined },
    ]

    expect(solve([...broken, samples[4]])).toEqual({
      status: 'unchanged',
      reason: 'too-few-samples',
      calibration: start,
    })
    expect(solve([...broken, ...samples]).calibration.residual).toBeLessThan(1e-6)
  })

  it('returns the starting calibration unchanged when the signal does not move with the targets', () => {
    // the eyes and the head did not move at all while the targets did
    const first = recordSamples(fivePoints, truth)[0]
    const frozen = fivePoints.map((target) => ({ ...first, target }))

    for (const eyeSignal of signals) {
      expect(solve(frozen, { eyeSignal })).toEqual({
        status: 'unchanged',
        reason: 'degenerate-samples',
        calibration: start,
      })
    }
  })

  it('never throws and never returns a number that is not finite, whatever the signal', () => {
    const samples = recordSamples(fivePoints, truth)
    // the eyes move sideways only, or against the targets
    const sideways = samples.map((sample) => ({
      ...sample,
      blendshapes: { ...sample.blendshapes!, eyeLookUpLeft: 0.1 },
    }))
    const reversed = samples.map((sample, index) => ({ ...sample, target: fivePoints[4 - index] }))
    // a head seen behind the webcam, a matrix of zeros, scores out of range
    const behind = samples.map((sample) => ({
      ...sample,
      matrix: sample.matrix.map((value, index) => (index === 14 ? 500 : value)),
    }))
    const zeros = samples.map((sample) => ({ ...sample, matrix: sample.matrix.map(() => 0) }))
    const huge = samples.map((sample, index) => ({
      ...sample,
      blendshapes: { ...sample.blendshapes!, eyeLookOutLeft: index * 1e6 },
    }))

    for (const broken of [sideways, reversed, behind, zeros, huge]) {
      for (const eyeSignal of signals) {
        for (const fit of [undefined, ['eyes.gain', 'eyes.offset', 'screen.offset', 'screen.tilt'] as const]) {
          const result = solve(broken, { eyeSignal, fit })

          expect(JSON.parse(JSON.stringify(result))).toEqual(result)
          const { screen, webcam, eyes, residual = 0 } = result.calibration
          const numbers = [screen.width, screen.height, ...screen.offset, screen.tilt, webcam.fov, ...eyes.gain]
          for (const value of [...numbers, ...eyes.offset, residual]) expect(Number.isFinite(value)).toBe(true)
        }
      }
    }
  })
})
