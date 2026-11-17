/** A gaze point on the screen, in pixels. */
export type GazeFilterPoint = { x: number; y: number }

/** Settings of the gaze filter. Every field is optional and falls back to `GazeFilterDefaults`. */
export type GazeFilterOptions = {
  /**
   * Time constant of the exponential moving average, in milliseconds: the time the output takes to cover 63 % of a
   * shift too small to be a saccade. Higher is steadier and slower. 0 turns the averaging off: each accepted sample is
   * the output. Default: 150
   */
  timeConstant?: number
  /**
   * A sample farther from the mean of the current fixation than `noiseMultiplier` times the noise is a saccade
   * candidate. Lower restarts on smaller eye movements, at the risk of restarting on noise. Default: 3
   */
  noiseMultiplier?: number
  /**
   * Floor of the saccade threshold, in pixels: whatever the noise, a move shorter than this is never a saccade.
   * Default: 40
   */
  minThreshold?: number
  /**
   * Noise of the signal, in pixels: the root mean square distance of the raw points to the point being looked at.
   * When set, it replaces the estimate the filter makes on its own. Default: undefined (estimated)
   */
  noise?: number
  /**
   * Time constant of the noise estimate, in milliseconds: how much of the recent signal the estimate remembers.
   * 0 turns the averaging off: the estimate is the latest distance alone. Unused when `noise` is set. Default: 1000
   */
  noiseTimeConstant?: number
}

/** Default settings of the gaze filter. `noise` has none: it is estimated from the signal. */
export const GazeFilterDefaults = {
  timeConstant: 150,
  noiseMultiplier: 3,
  minThreshold: 40,
  noiseTimeConstant: 1000,
} as const satisfies Required<Omit<GazeFilterOptions, 'noise'>>

/** A gaze filter, as returned by `createGazeFilter`. */
export type GazeFilter = {
  /**
   * Feeds one sample and returns the filtered point.
   * @param point the raw gaze point in screen pixels, or `null` when there is no signal (a gap)
   * @param time the timestamp of the sample, in milliseconds
   * @returns the filtered point, or `null` on a gap
   */
  update(point: GazeFilterPoint | null, time: number): GazeFilterPoint | null
  /** The latest filtered point, `null` before the first sample and during a gap. */
  readonly point: GazeFilterPoint | null
  /** Forgets everything, the noise estimate included, as if the filter had just been created. */
  reset(): void
}

/** The fixation being averaged. */
type Fixation = {
  /** Exponential moving average of the samples of the fixation: its mean, and the output of the filter. */
  x: number
  y: number
  /** Number of samples averaged so far. */
  count: number
  /** Timestamp of the last sample averaged, in milliseconds. */
  time: number
}

/** The noise estimate: an exponential moving average of the squared distance of the samples to their fixation. */
type Noise = {
  /** Mean squared distance, in square pixels. */
  variance: number
  /** Number of distances averaged so far. */
  count: number
  /** Timestamp of the last distance averaged, in milliseconds. */
  time: number
}

/**
 * Weight of a new sample in a frame-rate independent exponential moving average.
 *
 * `1 - exp(-elapsed / timeConstant)` is the exponential part. While the average holds fewer samples than that weight
 * accounts for, `1 / count` is used instead, which makes the start a plain mean: the first sample is not over-weighted.
 *
 * A time constant that is not a positive finite number means no memory: the weight is 1, whatever the time elapsed.
 */
function weight(elapsed: number, timeConstant: number, count: number) {
  const hasMemory = Number.isFinite(timeConstant) && timeConstant > 0
  if (!hasMemory) return 1

  const exponential = 1 - Math.exp(-Math.max(0, elapsed) / timeConstant)
  return Math.max(exponential, 1 / count)
}

function distance(a: GazeFilterPoint, b: GazeFilterPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * Creates a filter that turns the noisy stream of gaze points into a steady point during a fixation, and still jumps
 * at once when the eyes move to another place.
 *
 * - During a fixation the output is an exponential moving average of the input, aware of the time between samples.
 * - A sample far from the mean of the fixation is a saccade candidate. The output holds for that one sample. If the
 *   next sample lands next to the candidate, the saccade is confirmed and the average restarts from these two samples;
 *   otherwise the candidate was an outlier and is dropped.
 * - "Far" is `noiseMultiplier` times the noise, with a floor of `minThreshold`. The filter measures the noise itself,
 *   as the spread of the samples around their fixation, unless the `noise` option gives it.
 * - A gap in the signal (`null`) ends the fixation: the first point after it is returned as it is. The noise estimate
 *   survives gaps and saccades, since it describes the tracker and not the place being looked at.
 *
 * @example
 * const filter = createGazeFilter()
 * const steady = filter.update({ x: 512, y: 384 }, performance.now()) // a point
 * const lost = filter.update(null, performance.now()) // null, the next point starts afresh
 */
export function createGazeFilter(options: GazeFilterOptions = {}): GazeFilter {
  const {
    timeConstant,
    noiseMultiplier,
    minThreshold,
    noiseTimeConstant,
    noise: givenNoise,
  } = {
    ...GazeFilterDefaults,
    ...options,
  }

  let fixation: Fixation | null = null
  /** A sample far from the fixation, waiting for the next sample to tell a saccade from an outlier. */
  let candidate: GazeFilterPoint | null = null
  let noise: Noise | null = null

  function threshold() {
    const measured = givenNoise ?? (noise === null ? 0 : Math.sqrt(noise.variance))
    return Math.max(minThreshold, noiseMultiplier * measured)
  }

  /** Adds the distance of one sample to its fixation to the noise estimate. */
  function measureNoise(deviation: number, time: number) {
    if (noise === null) {
      noise = { variance: deviation ** 2, count: 1, time }
      return
    }
    noise.count += 1
    const alpha = weight(time - noise.time, noiseTimeConstant, noise.count)
    noise.variance += alpha * (deviation ** 2 - noise.variance)
    noise.time = time
  }

  function startFixation(point: GazeFilterPoint, time: number): Fixation {
    return { x: point.x, y: point.y, count: 1, time }
  }

  /** Averages one sample into the fixation. */
  function extendFixation(current: Fixation, point: GazeFilterPoint, time: number) {
    current.count += 1
    const alpha = weight(time - current.time, timeConstant, current.count)
    current.x += alpha * (point.x - current.x)
    current.y += alpha * (point.y - current.y)
    current.time = time
  }

  function update(point: GazeFilterPoint | null, time: number): GazeFilterPoint | null {
    if (point === null) {
      fixation = null
      candidate = null
      return null
    }

    if (fixation === null) {
      fixation = startFixation(point, time)
      return { x: point.x, y: point.y }
    }

    const limit = threshold()
    const deviation = distance(point, fixation)

    if (deviation <= limit) {
      // The fixation goes on. A pending candidate was an outlier.
      if (candidate !== null) measureNoise(limit, time)
      candidate = null
      measureNoise(deviation, time)
      extendFixation(fixation, point, time)
    } else if (candidate !== null && distance(point, candidate) <= limit) {
      // Two samples in a row far from the fixation and next to each other: a saccade. Restart from both.
      fixation = startFixation(candidate, time)
      extendFixation(fixation, point, time)
      candidate = null
    } else {
      // Far from the fixation: hold the output until the next sample confirms or dismisses the jump.
      // A pending candidate was an outlier. It counts as noise, capped at the threshold so that one wild sample does
      // not blow the estimate, while an estimate that is too low still grows until samples are accepted again.
      if (candidate !== null) measureNoise(limit, time)
      candidate = { x: point.x, y: point.y }
    }

    return { x: fixation.x, y: fixation.y }
  }

  return {
    update,
    get point() {
      return fixation === null ? null : { x: fixation.x, y: fixation.y }
    },
    reset() {
      fixation = null
      candidate = null
      noise = null
    },
  }
}
