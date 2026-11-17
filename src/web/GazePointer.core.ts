//
// Pointer core: from a stream of face detections to the target the user is looking at.
//
// Pure logic: no three.js, no React, no DOM. The scene is reached through one injected function, `pick`, and what
// has to be emitted comes back as a list of events. The component is a thin adapter over it: the r3f raycast is the
// pick function, the r3f handlers are the event sink.
//
// Each frame, in order:
//   1. the gaze model turns the detection into a point of the screen (`GazePointer.model`)
//   2. the filter steadies that point (`GazePointer.filter`)
//   3. the tolerance, in visual degrees, becomes a disc around the point, larger when the user is farther away
//   4. `pick` says which target lies under the disc: the candidate of the frame, or none
//   5. the candidate votes, and the target changes only when a challenger wins the majority of the vote window
//   6. when dwell is on and the target has been held long enough, it is clicked
//
// Three kinds of frames
// ---------------------
//
//   - A frame WITH a gaze point: the gaze falls on the screen. It votes for its candidate, or for "no candidate".
//   - A frame LOOKING AWAY: the eyes are open and tracked, but the gaze falls outside the screen. There is no gaze
//     point, and it votes for "no candidate". Looking away is therefore not a blink: the target is released through
//     the vote, like when the gaze moves to an empty part of the screen.
//   - A frame WITHOUT SIGNAL: there is no detection or no face, the gaze model returns nothing, or both eyes are
//     closed (a blink). Nothing can be said about where the user looks: there is no gaze point and the frame does
//     not vote. The current target is frozen for the blink grace delay, then released.
//
// Time is in milliseconds and comes from the caller: the vote window, the blink grace and the dwell are durations
// over the timestamps, not frame counts, so the behaviour does not depend on the frame rate.
//
// A detection seen twice
// ----------------------
//
// The core is fed once per rendered frame with the latest detection, and the screen is often faster than the webcam:
// at 60 frames per second and 30 Hz, every detection comes twice. A detection that is the very same object as the one
// of the previous frame is not a new sample of the gaze: it does not go through the filter again, and the frame reuses
// the signal and the filtered point of the previous one. Otherwise the repeat of an outlier would pass for the second
// sample that confirms a saccade. The rest of the frame runs as usual: the pick (the scene may have moved), the vote,
// the blink grace, the dwell, the events.
//
// Click and dwell
// ---------------
//
// A click is always the same three events on the current target: `down`, `up`, `click`. It comes from `click()`, on
// demand, or from the dwell: the user has kept the same target for the `dwell` duration.
//
//   - The dwell clock starts when the target is elected and stops when it is released, whatever the reason (the
//     vote, the end of the blink grace, `disable()`). Electing the same target again starts from zero.
//   - The clock is plain elapsed time since the election: it keeps running through a blink within the grace delay.
//     A blink is involuntary and the eyes come back where they were, so it neither cancels nor delays the dwell.
//   - The dwell click is only emitted in a frame with a signal, where the target has just been confirmed. A deadline
//     that falls during a blink is honoured on the first frame after it, and never if the target is released first.
//   - After a dwell click the target is disarmed: it must be released before the dwell can click it again. Its
//     progress stays at 1 meanwhile.
//   - `click()` is independent of all this: it does not arm, disarm or restart the dwell. An app that uses both
//     can therefore get a dwell click after an on-demand click on the same target.
//   - Changing the `dwell` option restarts the clock of the current target, so a new duration is never already over
//     and the change never clicks by itself. It does not re-arm a target the dwell has already clicked.
//

import { createGazeFilter, type GazeFilter, type GazeFilterOptions, type GazeFilterPoint } from './GazePointer.filter'
import {
  gazeDegreesToPixels,
  gazeRay,
  gazeRayOnScreen,
  type GazeCalibration,
  type GazeDetection,
  type GazeEyeSignal,
  type GazeModelOptions,
  type GazeScreen,
  type GazeScreenPoint,
} from './GazePointer.model'

//
// Types
//

/** Settings of the pointer core. Every field is optional and falls back to its default. */
export type GazePointerCoreOptions = {
  /** The calibration handed to the gaze model. Default: the priors alone. */
  calibration?: GazeCalibration
  /**
   * Tolerance of the election, in visual degrees: the half-angle of the cone around the gaze in which a target can be
   * picked. Default: derived from the calibration, see `resolveGazeTolerance`.
   */
  tolerance?: number
  /**
   * Length of the sliding vote window, in milliseconds. The target changes only when a challenger holds the majority
   * of the votes of the window. Longer is steadier and slower. Default: 200
   */
  voteWindow?: number
  /**
   * How long the current target survives a loss of signal (a blink, a lost face), in milliseconds. 0 releases it on
   * the first frame without signal. Default: 300
   */
  blinkGrace?: number
  /**
   * Score of the `eyeBlinkLeft` and `eyeBlinkRight` blendshapes above which an eye is closed. Both eyes have to be
   * closed for a frame to be a blink. Default: 0.5
   */
  blinkThreshold?: number
  /**
   * Dwell: `false`, or how long a target has to be held before it is clicked, in milliseconds. Changing it at
   * runtime restarts the dwell clock of the current target. Default: false
   */
  dwell?: false | number
  /** Settings of the gaze filter. Changing them at runtime restarts the filter. Default: those of the filter. */
  filter?: GazeFilterOptions
  /** Source of the eye-in-head angles, handed to the gaze model. Default: that of the model. */
  eyeSignal?: GazeEyeSignal
  /** Size of the physical screen in CSS pixels, handed to the gaze model. Default: read from the browser. */
  screen?: GazeScreen
  /** Width over height of the video, handed to the gaze model. Default: that of the model. */
  aspect?: number
}

/**
 * What the pick function returns for a frame: the target under the disc, and anything the caller wants back with the
 * events of that target (for the component: the intersection to point the raycaster at).
 */
export type GazePointerCandidate<Target, Hit = undefined> = {
  /** The target. Targets are compared by identity. */
  target: Target
  /** An opaque value, never read by the core, handed back in the events of this target. */
  hit?: Hit
}

/**
 * The function that connects the core to the scene: which target lies under a disc of the screen.
 *
 * @param point Centre of the disc: the filtered gaze point, in screen pixels.
 * @param radius Radius of the disc, in screen pixels.
 * @returns The candidate (the target closest to the centre, occlusion taken into account), or `null` for none.
 */
export type GazePointerPick<Target, Hit = undefined> = (
  point: GazeFilterPoint,
  radius: number
) => GazePointerCandidate<Target, Hit> | null

/**
 * Kinds of events:
 * - `enter`: the target has just been elected
 * - `move`: the target is held and there is a gaze point, once per such frame
 * - `leave`: the target has just been released
 * - `down`, `up`, `click`: a click on the target, always the three of them, in this order.
 */
export type GazePointerEventType = 'enter' | 'move' | 'leave' | 'down' | 'up' | 'click'

/** An event to emit on a target. */
export type GazePointerEvent<Target, Hit = undefined> = {
  type: GazePointerEventType
  /** The target the event is for. */
  target: Target
  /** The latest `hit` the pick function returned for this target, `undefined` when it returned none. */
  hit: Hit | undefined
}

/** The outcome of one frame. */
export type GazePointerFrame<Target, Hit = undefined> = {
  /** The filtered gaze point in screen pixels, `null` when the gaze is not on the screen or there is no signal. */
  point: GazeFilterPoint | null
  /** The elected target after this frame, or `null`. */
  target: Target | null
  /** Radius, in screen pixels, of the tolerance disc around `point`. 0 when `point` is `null`. */
  radius: number
  /**
   * Dwell progress of the current target, from 0 (just elected) to 1 (clicked by the dwell). `null` when dwell is
   * off or there is no target. It keeps rising through a blink within the grace delay, and stays at 1 after the
   * dwell click until the target is released.
   */
  dwellProgress: number | null
  /**
   * The events to emit for this frame, in order: `leave`, `enter`, `move`, then `down`, `up`, `click` when the
   * dwell clicks.
   */
  events: GazePointerEvent<Target, Hit>[]
}

/** A pointer core, as returned by `createGazePointerCore`. */
export type GazePointerCore<Target, Hit = undefined> = {
  /**
   * Feeds one frame. Call it once per rendered frame with the latest detection; a detection already seen is not
   * filtered twice: when it is the same object as in the previous frame, the frame keeps the filtered point of that
   * frame, and still picks, votes and emits.
   *
   * @param detection The latest raw MediaPipe detection, or `undefined` when there is none.
   * @param time Timestamp of the frame, in milliseconds. It must not go backwards.
   * @param pick Says which target lies under the disc. Called at most once, and only when there is a gaze point.
   * @returns The outcome of the frame.
   */
  update(
    detection: GazeDetection | undefined,
    time: number,
    pick: GazePointerPick<Target, Hit>
  ): GazePointerFrame<Target, Hit>
  /**
   * Replaces the options, as a whole: an absent field is back to its default. The current target, the votes and the
   * blink grace carry on. The filter carries on too, unless its own options changed, in which case it restarts. The
   * dwell clock of the current target carries on unless `dwell` changed, in which case it restarts from zero.
   *
   * Cheap when nothing changed, so it can be called on every render with the current props.
   */
  setOptions(options: GazePointerCoreOptions): void
  /**
   * Disables the core: the current target is released and everything it knew is forgotten. While disabled, `update`
   * ignores its frame, does not call the pick function and reports no point, no target and no event.
   *
   * @returns The events to emit: a `leave` when there was a target, nothing otherwise.
   */
  disable(): GazePointerEvent<Target, Hit>[]
  /**
   * Clicks the current target, on demand: for a key press, a voice command, a pinch. There is no press and hold.
   *
   * The target can be clicked as long as it is held, a blink within the grace delay included, and as many times as
   * asked. An on-demand click is independent of the dwell: it does not arm it, disarm it or restart its clock.
   *
   * @returns The events to emit: `down`, `up`, `click` on the current target, nothing when there is none.
   */
  click(): GazePointerEvent<Target, Hit>[]
  /** Enables the core again. The election starts afresh with the next frame. */
  enable(): void
  /** Whether the core is enabled. A new core is. */
  readonly enabled: boolean
  /** The elected target after the latest frame, or `null`. */
  readonly target: Target | null
  /** The filtered gaze point of the latest frame in screen pixels, or `null`. */
  readonly point: GazeFilterPoint | null
}

//
// Defaults
//

/** Default settings of the pointer core. */
export const GazePointerCoreDefaults = {
  /** Tolerance, in visual degrees, when the calibration carries no residual error: wide on purpose. */
  tolerance: 4,
  /** Floor of the tolerance derived from the residual error of a calibration, in visual degrees. */
  minTolerance: 2,
  /** Length of the sliding vote window, in milliseconds. */
  voteWindow: 200,
  /** How long the current target survives a loss of signal, in milliseconds. */
  blinkGrace: 300,
  /** Score of the blink blendshapes above which an eye is closed. */
  blinkThreshold: 0.5,
} as const

/**
 * The tolerance the core uses, in visual degrees.
 *
 * - An explicit tolerance wins.
 * - Otherwise, a calibration that carries its residual error (one produced by the solver) gives that residual, with
 *   a floor of `GazePointerCoreDefaults.minTolerance`: a poor calibration gets a wider cone.
 * - Otherwise the gaze is not calibrated, and the wide `GazePointerCoreDefaults.tolerance` applies.
 *
 * @param tolerance The explicit tolerance, if any.
 * @param calibration The calibration in use, if any. Only `residual` is read.
 */
export function resolveGazeTolerance(tolerance?: number, calibration?: GazeCalibration): number {
  if (tolerance !== undefined) return tolerance
  if (calibration?.residual === undefined) return GazePointerCoreDefaults.tolerance

  return Math.max(GazePointerCoreDefaults.minTolerance, calibration.residual)
}

//
// Core
//

/** What a detection says about the gaze: a point of the screen, a gaze that misses the screen, or nothing. */
type Signal = GazeScreenPoint | 'away' | 'none'

/** The vote of one frame: its candidate, or `null` for "no candidate". */
type Vote<Target, Hit> = { time: number; candidate: GazePointerCandidate<Target, Hit> | null }

/**
 * Creates a pointer core.
 *
 * `Target` is whatever the pick function returns as a target (a three.js object for the component); targets are
 * compared by identity. `Hit` is the type of the opaque value that rides along.
 *
 * @example
 * const core = createGazePointerCore<Object3D, Intersection>({ calibration })
 * // every frame
 * const { point, target, events } = core.update(detection, performance.now(), (point, radius) => {
 *   const hit = raycastDisc(point, radius)
 *   return hit ? { target: hit.object, hit } : null
 * })
 * for (const event of events) emit(event.type, event.target, event.hit)
 */
export function createGazePointerCore<Target, Hit = undefined>(
  initialOptions: GazePointerCoreOptions = {}
): GazePointerCore<Target, Hit> {
  let options = initialOptions
  let filter: GazeFilter = createGazeFilter(options.filter)
  let enabled = true

  /** The elected target, and the latest hit the pick function returned for it. */
  let target: Target | null = null
  let hit: Hit | undefined = undefined
  /** The filtered gaze point of the latest frame. */
  let point: GazeFilterPoint | null = null
  /** The detection of the latest frame and what it said about the gaze: the same object is not filtered twice. */
  let lastDetection: GazeDetection | undefined = undefined
  let lastSignal: Signal = 'none'
  /** The votes of the sliding window, oldest first. */
  let votes: Vote<Target, Hit>[] = []
  /** Timestamp of the latest frame that had a signal, `null` before the first one. */
  let lastSignalTime: number | null = null
  /** Timestamp of the latest frame, `null` before the first one. */
  let lastFrameTime: number | null = null
  /** When the dwell clock of the current target started, `null` without a target. */
  let dwellStart: number | null = null
  /** Whether the dwell has already clicked the current target: it has to be released before it can be again. */
  let dwellClicked = false

  function modelOptions(): GazeModelOptions {
    const { eyeSignal, screen, aspect } = options
    return { eyeSignal, screen, aspect }
  }

  /** A blink: both eyes closed, as told by the `eyeBlinkLeft` and `eyeBlinkRight` blendshapes. */
  function eyesClosed(detection: GazeDetection): boolean {
    const threshold = options.blinkThreshold ?? GazePointerCoreDefaults.blinkThreshold
    let left = 0
    let right = 0
    for (const category of detection.faceBlendshapes?.[0]?.categories ?? []) {
      if (category.categoryName === 'eyeBlinkLeft') left = category.score
      if (category.categoryName === 'eyeBlinkRight') right = category.score
    }
    return left > threshold && right > threshold
  }

  function readSignal(detection: GazeDetection | undefined): Signal {
    if (!detection || eyesClosed(detection)) return 'none'

    const ray = gazeRay(detection, options.calibration, modelOptions())
    if (!ray) return 'none'

    // A gaze that misses the screen is looking away.
    return gazeRayOnScreen(ray, options.calibration, modelOptions()) ?? 'away'
  }

  /** Releases the current target, if any, with a leave. */
  function release(events: GazePointerEvent<Target, Hit>[]) {
    if (target === null) return
    events.push({ type: 'leave', target, hit })
    target = null
    hit = undefined
    dwellStart = null
    dwellClicked = false
  }

  /** Dwell progress of the current target at `time`, from 0 to 1, `null` when dwell is off or there is no target. */
  function dwellProgressAt(time: number): number | null {
    const dwell = options.dwell ?? false
    if (dwell === false || target === null || dwellStart === null) return null
    if (dwellClicked) return 1

    const elapsed = time - dwellStart
    if (elapsed >= dwell) return 1
    return Math.max(0, elapsed / dwell)
  }

  /**
   * Adds the vote of a frame to the window and returns the candidate that holds the majority of it, `null` when "no
   * candidate" does, or `undefined` when nobody does.
   *
   * The window has to be at least half full, in time, before anyone can win: otherwise the very first frame would
   * hold all the votes, and the outcome would depend on the frame rate.
   */
  function castVote(candidate: GazePointerCandidate<Target, Hit> | null, time: number) {
    const voteWindow = options.voteWindow ?? GazePointerCoreDefaults.voteWindow

    votes.push({ time, candidate })
    votes = votes.filter((cast) => time - cast.time <= voteWindow)
    if (time - votes[0].time < voteWindow / 2) return undefined

    // the frames are counted per target; the latest candidate of a target carries its latest hit
    const counts = new Map<Target | null, number>()
    for (const cast of votes) {
      const key = cast.candidate === null ? null : cast.candidate.target
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    for (let i = votes.length - 1; i >= 0; i--) {
      const latest = votes[i].candidate
      const count = counts.get(latest === null ? null : latest.target) ?? 0
      if (count > votes.length / 2) return latest
    }
    return undefined
  }

  function update(
    detection: GazeDetection | undefined,
    time: number,
    pick: GazePointerPick<Target, Hit>
  ): GazePointerFrame<Target, Hit> {
    const events: GazePointerEvent<Target, Hit>[] = []
    if (!enabled) return { point: null, target: null, radius: 0, dwellProgress: null, events }
    lastFrameTime = time

    // The same detection object as in the previous frame is not a new sample: its signal and the filtered point of
    // that frame are reused, and the filter is not fed.
    const repeated = detection !== undefined && detection === lastDetection
    const signal = repeated ? lastSignal : readSignal(detection)
    lastDetection = detection
    lastSignal = signal

    if (signal === 'none') {
      // Nothing is known about the gaze: no point, no vote. The target is frozen until the grace delay is over;
      // then it is released, and the election starts afresh when the signal comes back.
      if (!repeated) point = filter.update(null, time)
      const blinkGrace = options.blinkGrace ?? GazePointerCoreDefaults.blinkGrace
      if (lastSignalTime === null || time - lastSignalTime >= blinkGrace) {
        release(events)
        votes = []
      }
      // The dwell clock keeps running, but the click waits for a frame with a signal.
      return { point, target, radius: 0, dwellProgress: dwellProgressAt(time), events }
    }
    lastSignalTime = time

    // The candidate of the frame. A gaze that misses the screen has no point, and votes for "no candidate".
    let candidate: GazePointerCandidate<Target, Hit> | null = null
    let radius = 0
    if (!repeated) point = filter.update(signal === 'away' ? null : { x: signal.x, y: signal.y }, time)
    if (signal !== 'away' && point !== null) {
      const tolerance = resolveGazeTolerance(options.tolerance, options.calibration)
      radius = gazeDegreesToPixels(tolerance, signal.distance, options.calibration, modelOptions())
      candidate = pick(point, radius)
    }
    if (candidate !== null && candidate.target === target) hit = candidate.hit

    // The election: the target changes only when a challenger, or "no candidate", holds the majority.
    const winner = castVote(candidate, time)
    if (winner !== undefined && (winner === null ? null : winner.target) !== target) {
      release(events)
      if (winner !== null) {
        target = winner.target
        hit = winner.hit
        dwellStart = time
        events.push({ type: 'enter', target, hit })
      }
    }

    if (target !== null && point !== null) events.push({ type: 'move', target, hit })

    // The dwell: once the target has been held for the duration, it is clicked, once.
    const dwellProgress = dwellProgressAt(time)
    if (dwellProgress === 1 && !dwellClicked) {
      dwellClicked = true
      pushClick(events)
    }

    return { point, target, radius, dwellProgress, events }
  }

  function setOptions(nextOptions: GazePointerCoreOptions) {
    // the filter reads its options once, when it is created
    if (!sameFilterOptions(options.filter, nextOptions.filter)) filter = createGazeFilter(nextOptions.filter)
    // a new duration must not be already over for a target held for a while: its clock restarts
    if ((options.dwell ?? false) !== (nextOptions.dwell ?? false) && target !== null) dwellStart = lastFrameTime
    options = nextOptions
  }

  function disable() {
    const events: GazePointerEvent<Target, Hit>[] = []
    release(events)
    enabled = false
    point = null
    lastDetection = undefined
    lastSignal = 'none'
    votes = []
    lastSignalTime = null
    lastFrameTime = null
    filter.reset()
    return events
  }

  /** Adds the click sequence on the current target, if any. */
  function pushClick(events: GazePointerEvent<Target, Hit>[]) {
    if (target === null) return
    events.push({ type: 'down', target, hit }, { type: 'up', target, hit }, { type: 'click', target, hit })
  }

  function click() {
    const events: GazePointerEvent<Target, Hit>[] = []
    pushClick(events)
    return events
  }

  function enable() {
    enabled = true
  }

  return {
    update,
    setOptions,
    disable,
    click,
    enable,
    get enabled() {
      return enabled
    },
    get target() {
      return target
    },
    get point() {
      return point
    },
  }
}

/** Whether two sets of filter options hold the same values. */
function sameFilterOptions(a: GazeFilterOptions = {}, b: GazeFilterOptions = {}): boolean {
  return (
    a.timeConstant === b.timeConstant &&
    a.noiseMultiplier === b.noiseMultiplier &&
    a.minThreshold === b.minThreshold &&
    a.noise === b.noise &&
    a.noiseTimeConstant === b.noiseTimeConstant
  )
}
