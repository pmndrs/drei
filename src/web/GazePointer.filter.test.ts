import { describe, expect, it } from 'vitest'
import { createGazeFilter, GazeFilterDefaults, type GazeFilter, type GazeFilterPoint } from './GazePointer.filter'

/** Deterministic uniform generator in [0, 1) (mulberry32), so the noisy tests are reproducible. */
function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic gaussian generator (Box-Muller), mean 0 and standard deviation 1. */
function createGaussian(seed: number) {
  const random = createRandom(seed)
  return () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
}

type Sample = { time: number; input: GazeFilterPoint; output: GazeFilterPoint }

/**
 * Feeds the filter with a gaze looking at `target(time)`, sampled at `rate` samples per second from 0 to `duration`
 * milliseconds, with gaussian noise of standard deviation `sigma` pixels on each axis.
 */
function run(
  filter: GazeFilter,
  {
    target,
    duration,
    rate = 30,
    sigma = 0,
    seed = 1,
  }: {
    target: (time: number) => GazeFilterPoint
    duration: number
    rate?: number
    sigma?: number
    seed?: number
  }
) {
  const gaussian = createGaussian(seed)
  const samples: Sample[] = []
  for (let i = 0; (i * 1000) / rate <= duration; i++) {
    const time = (i * 1000) / rate
    const { x, y } = target(time)
    const input = { x: x + sigma * gaussian(), y: y + sigma * gaussian() }
    const output = filter.update(input, time)
    if (output === null) throw new Error('the filter returned no point for a point')
    samples.push({ time, input, output })
  }
  return samples
}

const distance = (a: GazeFilterPoint, b: GazeFilterPoint) => Math.hypot(a.x - b.x, a.y - b.y)

/** Root mean square distance of the points to `center`. */
const spread = (points: GazeFilterPoint[], center: GazeFilterPoint) =>
  Math.sqrt(points.reduce((sum, point) => sum + distance(point, center) ** 2, 0) / points.length)

const A = { x: 500, y: 400 }
const B = { x: 900, y: 600 }

describe('createGazeFilter', () => {
  it('returns the first point as it is', () => {
    const filter = createGazeFilter()

    expect(filter.point).toBeNull()
    expect(filter.update({ x: 12, y: 34 }, 1000)).toEqual({ x: 12, y: 34 })
    expect(filter.point).toEqual({ x: 12, y: 34 })
  })

  it.each([5, 20, 60])('smooths a fixation: the output spread is clearly smaller than a noise of %i px', (sigma) => {
    const samples = run(createGazeFilter(), { target: () => A, duration: 5000, sigma })
    const settled = samples.filter(({ time }) => time >= 1000)

    const inputSpread = spread(
      settled.map(({ input }) => input),
      A
    )
    const outputSpread = spread(
      settled.map(({ output }) => output),
      A
    )

    expect(inputSpread).toBeGreaterThan(sigma)
    expect(outputSpread).toBeLessThan(inputSpread / 2)
  })

  it.each([30, 60])('follows a small shift at the pace of its time constant, at %i samples per second', (rate) => {
    // A 20 px shift is below the saccade threshold, so the average has to walk to it.
    const shifted = { x: A.x + 20, y: A.y }
    const filter = createGazeFilter({ timeConstant: 200 })
    const samples = run(filter, { target: (time) => (time > 1000 ? shifted : A), duration: 2000, rate })

    // One time constant after the shift, an exponential average has covered 63.2 % of it.
    const afterOneTimeConstant = samples.find(({ time }) => Math.abs(time - 1200) < 1e-6)
    expect(afterOneTimeConstant?.output.x).toBeCloseTo(A.x + 12.64, 1)
    expect(afterOneTimeConstant?.output.y).toBeCloseTo(A.y, 6)
  })

  it.each([30, 60])('restarts on a saccade instead of trailing behind, at %i samples per second', (rate) => {
    const filter = createGazeFilter()
    const samples = run(filter, { target: (time) => (time > 1000 ? B : A), duration: 2000, rate, sigma: 20 })
    const afterSaccade = samples.filter(({ time }) => time > 1000)

    // The first sample at B is only a candidate: the output holds near A until the next sample confirms it.
    expect(distance(afterSaccade[0].output, A)).toBeLessThan(30)
    // Confirmed by the second sample, the output is at B at once. A plain average would still be near A.
    expect(distance(afterSaccade[1].output, B)).toBeLessThan(60)
    // And it stays there, smoothing the new fixation.
    for (const { output } of afterSaccade.slice(1)) expect(distance(output, B)).toBeLessThan(60)
  })

  it('ignores a single outlier: a jump must be confirmed by the next sample', () => {
    const isOutlier = (time: number) => Math.abs(time - 1000) < 1
    const filter = createGazeFilter()
    const samples = run(filter, { target: (time) => (isOutlier(time) ? B : A), duration: 2000, sigma: 20 })
    const outlier = samples.findIndex(({ time }) => isOutlier(time))

    expect(distance(samples[outlier].input, B)).toBeLessThan(100)
    // The output does not move on the outlier, and the fixation goes on around A after it.
    expect(samples[outlier].output).toEqual(samples[outlier - 1].output)
    for (const { output } of samples.slice(outlier)) expect(distance(output, A)).toBeLessThan(30)
  })

  describe('saccade threshold', () => {
    /** Runs a fixation on A that jumps by `jump` pixels after one second, and returns the output two samples later. */
    function outputAfterJump(filter: GazeFilter, jump: number, sigma: number) {
      const jumped = { x: A.x + jump, y: A.y }
      const samples = run(filter, { target: (time) => (time > 1000 ? jumped : A), duration: 2000, sigma })
      const [, second] = samples.filter(({ time }) => time > 1000)
      return { jumped, output: second.output }
    }

    it('is proportional to the measured noise: the same jump is a saccade in a quiet signal only', () => {
      const quiet = outputAfterJump(createGazeFilter(), 100, 5)
      const noisy = outputAfterJump(createGazeFilter(), 100, 40)

      // Quiet signal: 100 px is far beyond the noise, the filter restarts at the new position.
      expect(distance(quiet.output, quiet.jumped)).toBeLessThan(15)
      // Noisy signal: 100 px is within the noise, the average keeps going and is still closer to A.
      expect(distance(noisy.output, A)).toBeLessThan(distance(noisy.output, noisy.jumped))
    })

    it('has a floor, so that a noiseless signal does not restart on every small move', () => {
      const below = outputAfterJump(createGazeFilter(), 30, 0)
      const above = outputAfterJump(createGazeFilter(), 60, 0)
      const raisedFloor = outputAfterJump(createGazeFilter({ minThreshold: 100 }), 60, 0)

      expect(distance(below.output, A)).toBeLessThan(15)
      expect(above.output).toEqual(above.jumped)
      expect(distance(raisedFloor.output, A)).toBeLessThan(30)
    })

    it('scales with the multiplier', () => {
      const strict = outputAfterJump(createGazeFilter({ noiseMultiplier: 3 }), 150, 20)
      const loose = outputAfterJump(createGazeFilter({ noiseMultiplier: 8 }), 150, 20)

      expect(distance(strict.output, strict.jumped)).toBeLessThan(60)
      expect(distance(loose.output, A)).toBeLessThan(distance(loose.output, loose.jumped))
    })

    it('uses the noise given as an option instead of its own estimate', () => {
      const estimated = outputAfterJump(createGazeFilter(), 100, 5)
      const overridden = outputAfterJump(createGazeFilter({ noise: 60 }), 100, 5)

      expect(distance(estimated.output, estimated.jumped)).toBeLessThan(15)
      expect(distance(overridden.output, A)).toBeLessThan(distance(overridden.output, overridden.jumped))
    })
  })

  it('resets on a gap: the first point after it is not averaged with the points before it', () => {
    const filter = createGazeFilter()
    run(filter, { target: () => A, duration: 1000, sigma: 20 })
    // Close enough to A for the average to drag the output if the gap had not reset it.
    const afterGap = { x: A.x + 30, y: A.y }

    expect(filter.update(null, 1033)).toBeNull()
    expect(filter.point).toBeNull()
    expect(filter.update(afterGap, 1066)).toEqual(afterGap)
  })

  it('forgets everything on reset()', () => {
    const filter = createGazeFilter()
    run(filter, { target: () => A, duration: 1000, sigma: 20 })
    const afterReset = { x: A.x + 30, y: A.y }

    filter.reset()

    expect(filter.point).toBeNull()
    expect(filter.update(afterReset, 1033)).toEqual(afterReset)
  })

  it('has working defaults for every setting but the noise override', () => {
    expect(GazeFilterDefaults).toEqual({
      timeConstant: 150,
      noiseMultiplier: 3,
      minThreshold: 40,
      noiseTimeConstant: 1000,
    })
  })
})
