/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import * as THREE from 'three'
import {
  Component,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { RootState, useFrame, useStore, useThree } from '@react-three/fiber'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'

import { FaceTracking, FaceTrackingApi, useFaceTracking } from './FaceTracking'
import { createGazePointerCore, GazePointerEvent, GazePointerPick } from './GazePointer.core'
import { gazeCalibrationSample, GazeCalibrationSample, solveGazeCalibration } from './GazePointer.calibration'
import { createGazeDebugOverlay, GazeDebugOverlay } from './GazePointer.debug'
import type { GazeFilterOptions } from './GazePointer.filter'
import type { GazeCalibration, ResolvedGazeCalibration } from './GazePointer.model'
import {
  closestGazeHit,
  gazeClientToNdc,
  gazeRayBundle,
  gazeScreenToClient,
  getGazeViewport,
  GazePoint,
  GazeRayHit,
  GazeRect,
} from './GazePointer.pick'

//
// What a user needs next to the component: the calibration type, the presets, and the conversions between the
// screen (the frame of the gaze point and of the calibration samples) and the page.
//

export { GazePointerDefaults } from './GazePointer.model'
export type { GazeCalibration, GazePreset, ResolvedGazeCalibration } from './GazePointer.model'
export type { GazeFilterOptions } from './GazePointer.filter'
export { gazeClientToScreen, gazeScreenToClient, getGazeViewport } from './GazePointer.pick'
export type { GazePoint } from './GazePointer.pick'

//
// Types
//

/** What `onDwellProgress` is called with. */
export type GazePointerDwellEvent = {
  /** The elected target the dwell is running on. */
  object: THREE.Object3D
  /** From 0 (just elected) to 1 (clicked by the dwell). It stays at 1 until the target is released. */
  progress: number
}

export type GazePointerProps = {
  /**
   * Whether the gaze drives the pointer events of the Canvas. While it does, the mouse and touch do not hover or
   * click in the Canvas. `false` hands the events back to them and releases the hovered target. Default: true
   */
  enabled?: boolean
  /**
   * The calibration of the gaze model: a plain serialisable object, controlled. Every field is optional and falls
   * back to its prior. Default: the priors alone (`GazePointerDefaults.desktop`)
   */
  calibration?: GazeCalibration
  /**
   * Tolerance of the election, in visual degrees: the half-angle of the cone around the gaze in which a target can
   * be picked. Default: the residual error of the calibration with a floor of 2, or 4 without a residual
   */
  tolerance?: number
  /** Dwell click: `false`, or how long a target has to be looked at before it is clicked, in ms. Default: false */
  dwell?: false | number
  /** How long the target survives a blink or a lost face, in ms. 0 releases it at once. Default: 300 */
  blinkGrace?: number
  /** Length of the vote window that steadies the election, in ms. Longer is steadier and slower. Default: 200 */
  voteWindow?: number
  /** Number of rays cast over the tolerance disc: the centre, then one or two rings. Default: 7 */
  rays?: number
  /** Settings of the gaze filter. Default: those of the filter */
  filter?: GazeFilterOptions
  /** Shows the gaze point, the tolerance disc and the elected target over the Canvas. Default: false */
  debug?: boolean
  /**
   * Called when the dwell progress of the elected target changes. Needs `dwell`. It is not called when the target is
   * released: reset your feedback from the `onPointerOut` of the target.
   */
  onDwellProgress?: (event: GazePointerDwellEvent) => void
}

export type GazePointerApi = {
  /**
   * Clicks the elected target: pointer down, pointer up, click. Does nothing without a target.
   * Call it from a key press, a voice command, a pinch.
   */
  click: () => void
  /**
   * Records one calibration sample: the user is looking at `target`, a point in screen pixels (see
   * `gazeClientToScreen` to get one from a point of the page). The detections of the last half second are averaged.
   * @returns Whether a sample was recorded: `false` when there was no face in that window.
   */
  addSample: (target: GazePoint) => boolean
  /**
   * Solves the recorded samples, starting from the current `calibration`.
   * @returns The calibration to pass as the `calibration` prop, with its `residual` error in visual degrees, or
   * `null` when the samples cannot be solved (fewer than five, or not spread over the screen).
   */
  solve: () => ResolvedGazeCalibration | null
  /** Forgets the recorded samples. */
  clearSamples: () => void
  /** The filtered gaze point in screen pixels, `null` without a signal. Live: read it in the frame loop. */
  readonly point: GazePoint | null
  /** The elected object, or `null`. Live: read it in the frame loop. */
  readonly target: THREE.Object3D | null
}

/** What rides along with a target: where it was hit, in its own frame, so the point follows the object. */
type GazePointerHit = { object: THREE.Object3D; local: THREE.Vector3 }

type GazePointerImplProps = GazePointerProps & {
  /** The tracking to read detections from, `null` when there is none (yet, or the webcam was refused) */
  faceTracking: FaceTrackingApi | null
}

//
// Constants
//

/**
 * The `pointerId` of the events emitted by the gaze: -1 is the id the Pointer Events specification reserves for
 * events that do not come from a pointing device.
 */
const GAZE_POINTER_ID = -1

/** How far back `addSample` averages the detections, in milliseconds. */
const SAMPLE_WINDOW = 500

/** How many recent detections are kept for `addSample`: half a second at up to 120 detections per second. */
const RECENT_DETECTIONS = 60

/** The DOM event each event of the core is emitted as. */
const DOM_EVENT_TYPES = {
  enter: 'pointermove',
  move: 'pointermove',
  leave: 'pointerleave',
  down: 'pointerdown',
  up: 'pointerup',
  click: 'click',
} as const

/**
 * What stands for the DOM target of the events emitted by the gaze. r3f forwards pointer captures to it: a real
 * element would throw on a pointer id the browser does not know, so they are accepted and ignored.
 */
const captureTarget = /* @__PURE__ */ Object.freeze({
  setPointerCapture() {},
  releasePointerCapture() {},
  hasPointerCapture: () => false,
})

//
// Component
//

/**
 * A gaze-driven pointer: turns where the user looks into the pointer source of the r3f events of its Canvas.
 * A mesh with `onPointerOver`, `onPointerOut`, `onPointerMove`, `onPointerDown`, `onPointerUp` or `onClick` reacts
 * to the gaze, with no new handler.
 *
 * It uses the `FaceTracking` above it when there is one, and otherwise opens the webcam for itself. Without a face, or
 * without a webcam (refused, missing) when it opens it itself, the pointer is inactive and nothing is thrown; under a
 * `FaceTracking`, a webcam error is thrown by that provider.
 *
 * Pre-requisite: wrap into a `FaceLandmarker` provider:
 *
 * ```jsx
 * <FaceLandmarker>
 *   <GazePointer />
 * </FaceLandmarker>
 * ```
 */
export const GazePointer = /* @__PURE__ */ forwardRef<GazePointerApi, GazePointerProps>((props, fref) => {
  const faceTracking = useFaceTracking()

  // No `FaceTracking` above: an implicit one, for this `GazePointer` alone, on a webcam it opens itself
  const webcam = useWebcam(!faceTracking)
  const videoTexture = useMemo(() => (webcam ? { src: webcam, start: true } : null), [webcam])
  const [ownFaceTracking, setOwnFaceTracking] = useState<FaceTrackingApi | null>(null)

  // A `FaceTracking` above: share its webcam and its detection
  if (faceTracking) {
    return <GazePointerImpl ref={fref} {...props} faceTracking={faceTracking} />
  }

  // The implicit tracking is rendered beside the pointer, not around it, and only once the webcam is open: without
  // a webcam, or if the tracking fails, the pointer stays mounted, inactive.
  return (
    <>
      {videoTexture && (
        <GazePointerTrackingBoundary>
          <FaceTracking ref={setOwnFaceTracking} videoTexture={videoTexture} />
        </GazePointerTrackingBoundary>
      )}
      <GazePointerImpl ref={fref} {...props} faceTracking={ownFaceTracking} />
    </>
  )
})

/**
 * Opens the webcam, and closes it on cleanup.
 *
 * `WebcamVideoTexture` is not used for the implicit tracking because it throws when the webcam is refused, and an
 * error caught by a boundary inside a Canvas is still reported to the page by r3f. Here a refusal is silent.
 *
 * @param active Whether the webcam is wanted.
 * @returns The stream, `null` until the webcam is open, and for good when it is refused or missing.
 */
function useWebcam(active: boolean): MediaStream | null {
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (!active) return

    // `mediaDevices` is missing outside a secure context
    const request = navigator.mediaDevices?.getUserMedia({ audio: false, video: { facingMode: 'user' } })
    if (!request) return

    let closed = false
    let opened: MediaStream | null = null
    const stop = (mediaStream: MediaStream) => mediaStream.getTracks().forEach((track) => track.stop())

    request.then(
      (mediaStream) => {
        // cleaned up before the webcam answered: close it right away
        if (closed) return stop(mediaStream)
        opened = mediaStream
        setStream(mediaStream)
      },
      () => {
        // refused or missing: no stream, the pointer stays inactive
      }
    )

    return () => {
      closed = true
      if (opened) stop(opened)
      setStream(null)
    }
  }, [active])

  return stream
}

/** Renders nothing in place of a tracking that failed (a video that cannot play), instead of taking the pointer down. */
class GazePointerTrackingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

const GazePointerImpl = /* @__PURE__ */ forwardRef<GazePointerApi, GazePointerImplProps>(
  (
    {
      faceTracking,
      enabled = true,
      calibration,
      tolerance,
      dwell = false,
      blinkGrace,
      voteWindow,
      rays = 7,
      filter,
      debug = false,
      onDwellProgress,
    },
    fref
  ) => {
    const store = useStore()
    const get = useThree((state) => state.get)
    const setEvents = useThree((state) => state.setEvents)
    const gl = useThree((state) => state.gl)

    //
    // The pointer core, and its options
    //

    const [core] = useState(() => createGazePointerCore<THREE.Object3D, GazePointerHit>())

    /** Width over height of the video, once known */
    const aspectRef = useRef<number | undefined>(undefined)

    const options = useMemo(
      () => ({ calibration, tolerance, dwell, blinkGrace, voteWindow, filter }),
      [calibration, tolerance, dwell, blinkGrace, voteWindow, filter]
    )
    useEffect(() => {
      core.setOptions({ ...options, aspect: aspectRef.current })
    }, [core, options])

    //
    // Pick: which interactive object lies under the tolerance disc
    //

    const bundle = useMemo(() => gazeRayBundle(rays), [rays])
    const [ndc] = useState(() => new THREE.Vector2())

    const pick = useCallback<GazePointerPick<THREE.Object3D, GazePointerHit>>(
      (point, radius) => {
        const state = get()
        if (!state.events.enabled) return null

        // from the screen to the canvas; a gaze outside the canvas picks nothing
        const canvas = state.gl.domElement
        const rect = canvas.getBoundingClientRect()
        const centre = gazeScreenToClient(point, getGazeViewport(canvas.ownerDocument.defaultView ?? window))
        if (!gazeClientToNdc(centre, rect)) return null

        // the interactive objects of this Canvas (not those of a portal, which has its own camera)
        const objects = state.internal.interaction.filter((object) => getInstance(object)?.root === store)

        // one ray per point of the bundle, each stopping at the first object: a hidden object is never hit
        const hits: GazeRayHit<THREE.Object3D, THREE.Intersection>[] = []
        for (const ray of bundle) {
          const rayNdc = gazeClientToNdc({ x: centre.x + ray.x * radius, y: centre.y + ray.y * radius }, rect)
          if (!rayNdc) continue

          state.raycaster.setFromCamera(ndc.set(rayNdc.x, rayNdc.y), state.camera)
          const first = firstIntersection(state, objects)
          if (!first) continue

          hits.push({
            offset: Math.hypot(ray.x, ray.y),
            target: getEventObject(first.object),
            distance: first.distance,
            hit: first,
          })
        }

        const closest = closestGazeHit(hits)
        if (!closest) return null

        const { object, point: world } = closest.hit
        return { target: closest.target, hit: { object, local: object.worldToLocal(world.clone()) } }
      },
      [bundle, get, ndc, store]
    )

    //
    // Emission: the events of the core become r3f events.
    //
    // The r3f raycaster is pointed at the hit of the target (through `events.compute`, see below), then the handler
    // r3f would have called for the DOM event is called: r3f intersects and dispatches by itself, so the mesh handlers
    // receive a real r3f event, with a real intersection, and r3f keeps its own record of what is hovered.
    //

    /** Where the r3f raycaster is pointed, in NDC. `null`: nowhere, nothing is under the gaze */
    const pointedRef = useRef<THREE.Vector2 | null>(null)
    const [pointed] = useState(() => new THREE.Vector2())
    const [world] = useState(() => new THREE.Vector3())

    const emit = useCallback(
      (events: GazePointerEvent<THREE.Object3D, GazePointerHit>[]) => {
        if (events.length === 0) return

        const state = get()
        const handlers = state.events.handlers
        if (!handlers) return

        for (let i = 0; i < events.length; i++) {
          const event = events[i]

          if (event.type === 'leave') {
            // r3f's own way out: what it does when the pointer leaves the canvas. It fires `onPointerOut` and
            // `onPointerLeave` on everything it has hovered.
            pointedRef.current = null
            handlers.onPointerLeave(createGazeEvent('leave', 0, 0, state))
            // nothing is left to replay for `events.update()`
            state.internal.lastEvent.current = null
            continue
          }

          if (!event.hit) continue
          // the `enter` of this frame has already moved the pointer onto the target
          const previous = events[i - 1]
          if (event.type === 'move' && previous?.type === 'enter' && previous.target === event.target) continue

          // the hit point, where the object is now
          world.copy(event.hit.local)
          event.hit.object.localToWorld(world).project(state.camera)
          pointedRef.current = pointed.set(world.x, world.y)

          const offsetX = ((pointed.x + 1) / 2) * state.size.width
          const offsetY = ((1 - pointed.y) / 2) * state.size.height
          const domEvent = createGazeEvent(event.type, offsetX, offsetY, state)

          if (event.type === 'enter' || event.type === 'move') handlers.onPointerMove(domEvent)
          if (event.type === 'down') handlers.onPointerDown(domEvent)
          if (event.type === 'up') {
            handlers.onPointerUp(domEvent)
            // a capture taken by a handler ends with the click, as it does when a real pointer is released
            state.internal.capturedMap.delete(GAZE_POINTER_ID)
          }
          if (event.type === 'click') handlers.onClick(domEvent)
        }
      },
      [get, pointed, world]
    )

    //
    // Exclusivity: while enabled, the gaze is the only pointer source of the Canvas
    //

    useEffect(() => {
      if (!enabled) {
        // A core is created enabled: a pointer mounted with `enabled={false}` has to be told. After the cleanup
        // below, which has already disabled it, this emits nothing.
        emit(core.disable())
        return
      }

      const { events, internal } = get()
      const previous = {
        compute: events.compute,
        filter: events.filter,
        connected: events.connected,
        lastEvent: internal.lastEvent.current,
      }

      // The mouse and touch leave: what they were hovering is released, and r3f stops listening to the DOM.
      events.handlers?.onPointerLeave(createGazeEvent('leave', 0, 0, get()))
      events.disconnect?.()

      // r3f asks `compute` where the pointer is before each of its raycasts: at the hit of the elected target.
      setEvents({
        compute(_event, state) {
          // nowhere: the raycaster is left without a camera, which makes r3f skip the raycast
          if (!pointedRef.current) return

          state.pointer.copy(pointedRef.current)
          state.raycaster.setFromCamera(state.pointer, state.camera)
        },
        // Only what the gaze sees: of everything r3f finds along the ray, the first hit is kept (after the custom
        // order of the app, if any), so an object hidden behind the target gets no event.
        filter(intersections, state) {
          const ordered = previous.filter ? previous.filter(intersections, state) : intersections
          return ordered.slice(0, 1)
        },
      })

      core.enable()

      return () => {
        // release the target (r3f fires its out), then put back exactly what was there
        emit(core.disable())
        pointedRef.current = null

        setEvents({ compute: previous.compute, filter: previous.filter })
        get().internal.lastEvent.current = previous.lastEvent
        if (previous.connected) get().events.connect?.(previous.connected)
      }
    }, [enabled, core, emit, get, setEvents])

    //
    // Debug overlay
    //

    const overlayRef = useRef<GazeDebugOverlay | null>(null)
    useEffect(() => {
      const parent = gl.domElement.parentElement
      if (!debug || !parent) return

      const overlay = createGazeDebugOverlay(parent)
      overlayRef.current = overlay

      return () => {
        overlay.dispose()
        overlayRef.current = null
      }
    }, [debug, gl])

    //
    // Frame loop: the latest detection goes through the core, and what comes out is emitted
    //

    const dwellRef = useRef<GazePointerDwellEvent | null>(null)

    useFrame((state) => {
      // the aspect ratio of the video, as soon as the video has a size
      const video: Partial<HTMLVideoElement> | undefined = faceTracking?.videoTextureRef.current?.image
      const aspect = video?.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : undefined
      if (aspect !== aspectRef.current) {
        aspectRef.current = aspect
        core.setOptions({ ...options, aspect })
      }

      const frame = core.update(faceTracking?.getResult(), performance.now(), pick)
      emit(frame.events)

      // dwell progress, when it changed
      if (frame.target && frame.dwellProgress !== null) {
        const last = dwellRef.current
        if (!last || last.object !== frame.target || last.progress !== frame.dwellProgress) {
          dwellRef.current = { object: frame.target, progress: frame.dwellProgress }
          onDwellProgress?.(dwellRef.current)
        }
      } else {
        dwellRef.current = null
      }

      const overlay = overlayRef.current
      if (overlay) {
        const canvas = state.gl.domElement
        const viewport = getGazeViewport(canvas.ownerDocument.defaultView ?? window)
        overlay.update({
          point: frame.point && gazeScreenToClient(frame.point, viewport),
          radius: frame.radius,
          target: frame.target && getClientRect(frame.target, state.camera, canvas.getBoundingClientRect()),
        })
      }
    })

    //
    // Calibration samples
    //

    /** The latest detections, oldest first, for `addSample` to average */
    const [recent] = useState<{ time: number; detection: FaceLandmarkerResult }[]>(() => [])
    const [samples] = useState<GazeCalibrationSample[]>(() => [])

    useEffect(() => {
      if (!faceTracking) return

      return faceTracking.subscribe((detection) => {
        if (!detection) return
        recent.push({ time: performance.now(), detection })
        if (recent.length > RECENT_DETECTIONS) recent.shift()
      })
    }, [faceTracking, recent])

    //
    // Ref API
    //

    const api = useMemo<GazePointerApi>(
      () => ({
        click() {
          emit(core.click())
        },
        addSample(target) {
          const since = performance.now() - SAMPLE_WINDOW
          const detections = recent.filter(({ time }) => time >= since).map(({ detection }) => detection)

          const sample = gazeCalibrationSample(target, detections)
          if (!sample) return false

          samples.push(sample)
          return true
        },
        solve() {
          // the same model options as the pointer
          const result = solveGazeCalibration(samples, { start: calibration, aspect: aspectRef.current })
          return result.status === 'solved' ? result.calibration : null
        },
        clearSamples() {
          samples.length = 0
        },
        get point() {
          return core.point
        },
        get target() {
          return core.target
        },
      }),
      [calibration, core, emit, recent, samples]
    )
    useImperativeHandle(fref, () => api, [api])

    return null
  }
)

//
// Helpers
//

/** The part of what r3f attaches to the objects it manages that is read here. */
type Instance = { root: unknown; eventCount: number }

function getInstance(object: THREE.Object3D): Instance | undefined {
  return (object as THREE.Object3D & { __r3f?: Instance }).__r3f
}

/** The object an event on `object` is for: itself or its closest ancestor with r3f handlers. */
function getEventObject(object: THREE.Object3D): THREE.Object3D {
  let eventObject: THREE.Object3D | null = object
  while (eventObject) {
    if (getInstance(eventObject)?.eventCount) return eventObject
    eventObject = eventObject.parent
  }
  return object
}

/** The first thing the r3f raycaster, already set, hits among the interactive objects. */
function firstIntersection(state: RootState, objects: THREE.Object3D[]): THREE.Intersection | null {
  let intersections: THREE.Intersection[] = []
  for (const object of objects) state.raycaster.intersectObject(object, true, intersections)
  intersections.sort((a, b) => a.distance - b.distance)

  // the custom order of the app, as r3f applies it
  if (state.events.filter) intersections = state.events.filter(intersections, state)

  return intersections[0] ?? null
}

/**
 * The DOM event handed to r3f for an event of the core: a real `PointerEvent`, of type `gaze`.
 *
 * `offsetX` and `offsetY` are the position in the canvas (r3f reads them to measure the travel of a click). They
 * and `target` are computed by the browser when an event is dispatched, which this one never is: they are set here.
 */
function createGazeEvent(type: keyof typeof DOM_EVENT_TYPES, offsetX: number, offsetY: number, state: RootState) {
  const event = new PointerEvent(DOM_EVENT_TYPES[type], {
    pointerId: GAZE_POINTER_ID,
    pointerType: 'gaze',
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    button: 0,
    buttons: type === 'down' ? 1 : 0,
    clientX: state.size.left + offsetX,
    clientY: state.size.top + offsetY,
  })

  return Object.defineProperties(event, {
    offsetX: { value: offsetX, enumerable: true },
    offsetY: { value: offsetY, enumerable: true },
    target: { value: captureTarget, enumerable: true },
  })
}

const box = /* @__PURE__ */ new THREE.Box3()
const corner = /* @__PURE__ */ new THREE.Vector3()

/** The rectangle, in the client frame, around an object as the camera sees it. `null` when it has no extent. */
function getClientRect(object: THREE.Object3D, camera: THREE.Camera, canvas: GazeRect): GazeRect | null {
  box.setFromObject(object)
  if (box.isEmpty()) return null

  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        corner.set(x, y, z).project(camera)
        left = Math.min(left, corner.x)
        right = Math.max(right, corner.x)
        top = Math.min(top, -corner.y)
        bottom = Math.max(bottom, -corner.y)
      }
    }
  }

  return {
    left: canvas.left + ((left + 1) / 2) * canvas.width,
    top: canvas.top + ((top + 1) / 2) * canvas.height,
    width: ((right - left) / 2) * canvas.width,
    height: ((bottom - top) / 2) * canvas.height,
  }
}
