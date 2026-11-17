//
// Gaze model: from a raw MediaPipe face detection to a point of the physical screen.
//
// Pure functions on plain numbers: no DOM access at import time, no three.js scene, no `Facemesh`.
//
// Frames and units
// ----------------
//
// Webcam frame (centimetres). It is the metric space of MediaPipe's `facialTransformationMatrix`:
//   - origin: the optical centre of the webcam
//   - +x: to the right of the image as the webcam captures it (not mirrored), which is the LEFT of the user
//   - +y: up
//   - +z: from the user towards the webcam. The webcam looks down -z, so a face in view has a negative z.
//
// Head frame (centimetres). It is the frame of MediaPipe's canonical face model, which the matrix maps to the
// webcam frame:
//   - +x: the left of the face, +y: up, +z: out of the face, through the nose.
//
// Eye angles (degrees), in the head frame:
//   - yaw: positive when the eyes turn to the left of the user (+x)
//   - pitch: positive when the eyes look up (+y)
//   - both zero: the eyes look straight out of the face (+z).
//
// Screen frame (pixels). CSS pixels of the physical screen, as in `window.screen` and `window.screenX`:
//   - origin: the top left corner of the screen, as the user sees it
//   - +x: to the right of the user, +y: down.
//
// What was checked about MediaPipe, and where (google-ai-edge/mediapipe, `master`):
//   - `tasks/cc/vision/face_geometry/proto/face_geometry.proto`: the pose transform matrix "provides mapping from
//     the static canonical face model to the runtime face", holds a uniform scale, a rotation and a translation, in
//     a "right-handed Metric 3D space".
//   - `tasks/cc/vision/face_geometry/face_geometry_from_landmarks_graph.cc`: the Face Landmarker task always
//     assumes a perspective camera with a vertical field of view of 63 degrees, a near plane at "1cm" and a far
//     plane at "100m" (hence centimetres), whatever the real webcam is.
//   - `framework/formats/matrix_data.proto`: "Data are stored in column-major order by default", and the web task
//     (`tasks/web/vision/face_landmarker/face_landmarker.ts`) copies the packed data as is.
//   - `python/solutions/face_mesh_connections.py`: landmarks 469 to 472 are the RIGHT iris and 474 to 477 the LEFT
//     one (468 and 473 are their centres); "left" and "right" are those of the person.
//   - The axes are not stated in the sources. They were checked on the real sample at the bottom of `Facemesh.tsx`
//     (`FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT`, a 640 x 480 capture): the translation is the last column
//     (2.9, -7.8, -30.5), its negative z puts the face in front of a webcam looking down -z, its positive x and
//     negative y agree with a face seen right of and below the image centre (landmarks around x 0.56, y 0.65), and
//     projecting the canonical eye corners through the matrix with a 63 degree vertical field of view lands on the
//     eye landmarks for a 4:3 image.
//

//
// Types
//

/** Three numbers: a position in centimetres or a unit direction, in the webcam frame unless stated otherwise. */
export type GazeVector = readonly [x: number, y: number, z: number]

/**
 * The part of a MediaPipe `FaceLandmarkerResult` the gaze model reads. A `FaceLandmarkerResult` is assignable to it.
 * Only the first face is used.
 */
export type GazeDetection = {
  /** Per face, the 478 landmarks, `x` and `y` normalised to the width and the height of the (unmirrored) video. */
  faceLandmarks: ReadonlyArray<ReadonlyArray<{ x: number; y: number; z: number }>>
  /** Per face, the 52 blendshapes. Read by name (`eyeLookInLeft`...), needed by the `blendshapes` eye signal. */
  faceBlendshapes?: ReadonlyArray<{ categories: ReadonlyArray<{ categoryName: string; score: number }> }>
  /** Per face, the 4x4 head transformation matrix, column-major, in centimetres. Always needed. */
  facialTransformationMatrixes?: ReadonlyArray<{ data: ReadonlyArray<number> }>
}

/**
 * What the model needs to know beyond the detection: the physical screen relative to the webcam, the webcam, and a
 * per-user correction of the eye angles.
 *
 * A plain serialisable object. Every field is optional and falls back to its prior (see `resolveGazeCalibration`).
 */
export type GazeCalibration = {
  /** The physical screen, relative to the webcam. */
  screen?: {
    /** Width of the screen in centimetres. Prior: its width in CSS pixels divided by `density`. */
    width?: number
    /** Height of the screen in centimetres. Prior: its height in CSS pixels divided by `density`. */
    height?: number
    /**
     * Position of the middle of the top edge of the screen, in centimetres, in the webcam frame (+x to the left of
     * the user, +y up, +z away from the user, behind the webcam).
     * `[0, 0, 0]` is a webcam sitting exactly on the middle of the top edge; `[0, height, 0]` a webcam on the middle
     * of the bottom edge.
     */
    offset?: readonly [x: number, y: number, z: number]
    /**
     * How much the webcam is pitched down towards the user relative to the screen, in degrees. Zero when the webcam
     * looks along the normal of the screen, which is the case of a webcam built into the screen.
     */
    tilt?: number
    /**
     * CSS pixels per centimetre, used only to estimate `width` and `height` when they are absent.
     * Not part of a solved calibration, which states both.
     */
    density?: number
  }
  /** The webcam. */
  webcam?: {
    /**
     * Vertical field of view of the video, in degrees. MediaPipe assumes 63: with another value the distance of the
     * head is rescaled accordingly.
     */
    fov?: number
  }
  /** Per-user correction of the eye angles: `corrected = raw * gain + offset`. */
  eyes?: {
    /** Unitless factors applied to the yaw and to the pitch. */
    gain?: readonly [yaw: number, pitch: number]
    /** Degrees added to the yaw and to the pitch. */
    offset?: readonly [yaw: number, pitch: number]
  }
  /** Residual error in visual degrees, present when the calibration was produced by a solver. Not read here. */
  residual?: number
}

/** A calibration with every prior applied: what the model actually computes with. */
export type ResolvedGazeCalibration = {
  /** The physical screen relative to the webcam: centimetres and degrees. */
  screen: { width: number; height: number; offset: readonly [x: number, y: number, z: number]; tilt: number }
  /** The webcam: vertical field of view in degrees. */
  webcam: { fov: number }
  /** Per-user correction of the eye angles: unitless gains, offsets in degrees. */
  eyes: { gain: readonly [yaw: number, pitch: number]; offset: readonly [yaw: number, pitch: number] }
  /** Residual error in visual degrees, when the calibration came from a solver. */
  residual?: number
}

/** A preset: every prior that does not depend on the screen the page runs on. */
export type GazePreset = {
  readonly screen: {
    readonly offset: readonly [x: number, y: number, z: number]
    readonly tilt: number
    readonly density: number
  }
  readonly webcam: { readonly fov: number }
  readonly eyes: {
    readonly gain: readonly [yaw: number, pitch: number]
    readonly offset: readonly [yaw: number, pitch: number]
  }
}

/** Size of the physical screen in CSS pixels, as in `window.screen.width` and `window.screen.height`. */
export type GazeScreen = { width: number; height: number }

/**
 * Where the eye-in-head angles come from:
 * - `blendshapes`: the `eyeLook*` blendshapes
 * - `iris`: the iris landmarks (468 and 473), seen as points of an eyeball of known centre and radius.
 */
export type GazeEyeSignal = 'blendshapes' | 'iris'

/** Options of the model functions. */
export type GazeModelOptions = {
  /** Source of the eye-in-head angles. Default: `blendshapes` (provisional). */
  eyeSignal?: GazeEyeSignal
  /** Size of the physical screen in CSS pixels. Default: read from the browser when called, see `getGazeScreen`. */
  screen?: GazeScreen
  /** Width over height of the video the landmarks are normalised to. Only read by the `iris` signal. Default: 4/3. */
  aspect?: number
}

/** Eye-in-head angles in degrees, in the head frame: `yaw` positive to the left of the user, `pitch` positive up. */
export type GazeEyeAngles = { yaw: number; pitch: number }

/** A gaze ray in the webcam frame: `origin` in centimetres (the point between the eyes), `direction` of length 1. */
export type GazeRay = { origin: GazeVector; direction: GazeVector }

/**
 * A gaze point on the plane of the screen: `x` and `y` in screen pixels (origin at the top left corner, +y down),
 * `distance` in centimetres between the eyes and that point.
 */
export type GazeScreenPoint = { x: number; y: number; distance: number }

//
// Constants
//

/** The vertical field of view, in degrees, that MediaPipe assumes when it computes the head matrix. */
export const GAZE_MEDIAPIPE_FOV = 63

/**
 * Centres of the eyeballs in the head frame, in centimetres.
 *
 * Provisional: placed behind the middle of the eye corners of MediaPipe's canonical face model (vertices 33, 133,
 * 263 and 362 of `canonical_face_model.obj`, around x 3.15, y 2.62, z 3.47), and raised so that the two eye signals
 * roughly agree on the one real sample at hand (`FacemeshDatas.SAMPLE_FACELANDMARKER_RESULT`).
 * A constant error here is absorbed by `GazeCalibration.eyes.offset`.
 */
export const GAZE_EYE_CENTERS = /* @__PURE__ */ deepFreeze({
  left: [3.15, 3, 2.6],
  right: [-3.15, 3, 2.6],
} as const)

/** Distance between the centre of an eyeball and the centre of its iris, in centimetres. Provisional. */
export const GAZE_EYE_RADIUS = 1.2

/**
 * Eye angles, in degrees, that a full `eyeLook*` blendshape score stands for: `yaw` for `eyeLookIn` and `eyeLookOut`,
 * `pitch` for `eyeLookUp` and `eyeLookDown`. They are half of the eye ranges `Facemesh` uses (100 and 90 degrees).
 */
export const GAZE_BLENDSHAPES_RANGE = /* @__PURE__ */ deepFreeze({ yaw: 50, pitch: 45 } as const)

/** The landmarks at the centre of each iris. "Left" and "right" are those of the user. */
export const GAZE_IRIS_LANDMARKS = /* @__PURE__ */ deepFreeze({ left: 473, right: 468 } as const)

/**
 * The read-only presets of priors.
 *
 * - `desktop`: a computer whose webcam sits just above the middle of the top edge of the screen. It is the default:
 *   every field absent from a calibration falls back to it.
 * - `mobile`: a phone held in portrait, front camera at the middle of the top edge.
 *
 * A preset is a valid (partial) `GazeCalibration`: pass it as is, or spread it under the fields you know.
 * It has no screen size: the size is estimated from the browser screen and the `density` of the preset.
 */
export const GazePointerDefaults: { readonly desktop: GazePreset; readonly mobile: GazePreset } =
  /* @__PURE__ */ deepFreeze({
    desktop: {
      // the lens is about 1 cm above the first row of pixels; about 100 CSS pixels per inch
      screen: { offset: [0, -1, 0], tilt: 0, density: 40 },
      webcam: { fov: GAZE_MEDIAPIPE_FOV },
      eyes: { gain: [1, 1], offset: [0, 0] },
    },
    mobile: {
      // the lens is in the top edge; about 150 CSS pixels per inch
      screen: { offset: [0, 0, 0], tilt: 0, density: 60 },
      webcam: { fov: GAZE_MEDIAPIPE_FOV },
      eyes: { gain: [1, 1], offset: [0, 0] },
    },
  })

/** The screen assumed when there is no browser to ask (node, server rendering), in CSS pixels. */
const FALLBACK_SCREEN: GazeScreen = /* @__PURE__ */ deepFreeze({ width: 1920, height: 1080 })

//
// Priors
//

/**
 * Size of the physical screen in CSS pixels, read from the browser at the time of the call.
 * Without a browser (node, server rendering) it returns a 1920 x 1080 fallback.
 */
export function getGazeScreen(): GazeScreen {
  const browserScreen = typeof globalThis === 'object' ? (globalThis as { screen?: Partial<GazeScreen> }).screen : null
  if (!browserScreen || !browserScreen.width || !browserScreen.height) return FALLBACK_SCREEN

  return { width: browserScreen.width, height: browserScreen.height }
}

/**
 * Fills every absent field of a calibration with its prior.
 *
 * The priors are those of `GazePointerDefaults.desktop`; the size of the screen in centimetres is estimated from its
 * size in CSS pixels and the `density`.
 *
 * @param calibration A partial calibration, or nothing for the priors alone.
 * @param screen Size of the physical screen in CSS pixels. Default: read from the browser, see `getGazeScreen`.
 */
export function resolveGazeCalibration(
  calibration: GazeCalibration = {},
  screen: GazeScreen = getGazeScreen()
): ResolvedGazeCalibration {
  const priors = GazePointerDefaults.desktop
  const density = calibration.screen?.density ?? priors.screen.density

  const resolved: ResolvedGazeCalibration = {
    screen: {
      width: calibration.screen?.width ?? screen.width / density,
      height: calibration.screen?.height ?? screen.height / density,
      offset: calibration.screen?.offset ?? priors.screen.offset,
      tilt: calibration.screen?.tilt ?? priors.screen.tilt,
    },
    webcam: { fov: calibration.webcam?.fov ?? priors.webcam.fov },
    eyes: {
      gain: calibration.eyes?.gain ?? priors.eyes.gain,
      offset: calibration.eyes?.offset ?? priors.eyes.offset,
    },
  }
  if (calibration.residual !== undefined) resolved.residual = calibration.residual

  return resolved
}

//
// Model
//

/**
 * The raw eye-in-head angles of a detection, before the per-user correction of the calibration.
 *
 * The two eyes are averaged.
 *
 * @param detection A raw MediaPipe detection result.
 * @param calibration Only `webcam.fov` is read, and only by the `iris` signal.
 * @param options `eyeSignal` picks the source; `aspect` is read by the `iris` signal.
 * @returns Angles in degrees in the head frame, or `null` when the detection lacks what the signal needs.
 */
export function gazeEyeAngles(
  detection: GazeDetection,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): GazeEyeAngles | null {
  if (options.eyeSignal !== 'iris') return blendshapesAngles(detection)

  const fov = calibration?.webcam?.fov ?? GazePointerDefaults.desktop.webcam.fov
  const head = headPose(detection, fov)
  if (!head) return null

  return irisAngles(detection, head, fov, options)
}

/**
 * The metric gaze ray of a detection, in the webcam frame.
 *
 * It starts at the point between the two eyeballs and points along the eye-in-head angles, corrected by
 * `calibration.eyes` and carried by the rotation of the head.
 *
 * @param detection A raw MediaPipe detection result.
 * @param calibration A partial calibration; absent fields fall back to their priors.
 * @param options Eye signal, screen and video aspect.
 * @returns The ray, or `null` when there is no face or the detection lacks what the eye signal needs.
 */
export function gazeRay(
  detection: GazeDetection,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): GazeRay | null {
  const fov = calibration?.webcam?.fov ?? GazePointerDefaults.desktop.webcam.fov
  const gain = calibration?.eyes?.gain ?? GazePointerDefaults.desktop.eyes.gain
  const offset = calibration?.eyes?.offset ?? GazePointerDefaults.desktop.eyes.offset

  const head = headPose(detection, fov)
  if (!head) return null

  const raw = gazeEyeAngles(detection, calibration, options)
  if (!raw) return null

  const yaw = raw.yaw * gain[0] + offset[0]
  const pitch = raw.pitch * gain[1] + offset[1]

  const left = headToWebcam(head, GAZE_EYE_CENTERS.left)
  const right = headToWebcam(head, GAZE_EYE_CENTERS.right)

  return {
    origin: [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2, (left[2] + right[2]) / 2],
    direction: rotate(head, anglesToDirection(yaw, pitch)),
  }
}

/**
 * Intersects a gaze ray with the plane of the physical screen.
 *
 * The point is not limited to the surface of the screen: it can have negative coordinates or exceed the size of the
 * screen. Use `gazeToScreen` to get `null` in that case.
 *
 * @param ray A gaze ray in the webcam frame, as returned by `gazeRay`.
 * @param calibration A partial calibration; absent fields fall back to their priors.
 * @param options Only `screen` is read.
 * @returns The point in screen pixels with its distance to the eyes in centimetres, or `null` when the ray does not
 * go towards the plane of the screen.
 */
export function gazeRayToScreen(
  ray: GazeRay,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): GazeScreenPoint | null {
  const screen = options.screen ?? getGazeScreen()
  const { width, height, offset, tilt } = resolveGazeCalibration(calibration, screen).screen

  // The screen in the webcam frame: its "right" is the right of the user (-x), its "down" leans towards the user
  // (-z) by the tilt, and its normal points away from the user.
  const cos = Math.cos(toRadians(tilt))
  const sin = Math.sin(toRadians(tilt))
  const right: GazeVector = [-1, 0, 0]
  const down: GazeVector = [0, -cos, -sin]
  const normal: GazeVector = [0, -sin, cos]

  const approach = dot(ray.direction, normal)
  if (approach <= 1e-9) return null // parallel to the screen, or looking away from it

  const toScreen: GazeVector = [offset[0] - ray.origin[0], offset[1] - ray.origin[1], offset[2] - ray.origin[2]]
  const distance = dot(toScreen, normal) / approach
  if (distance <= 0) return null // the eyes are behind the screen

  // the hit point, relative to the middle of the top edge
  const hit: GazeVector = [
    ray.direction[0] * distance - toScreen[0],
    ray.direction[1] * distance - toScreen[1],
    ray.direction[2] * distance - toScreen[2],
  ]

  return {
    x: (dot(hit, right) + width / 2) * (screen.width / width),
    y: dot(hit, down) * (screen.height / height),
    distance,
  }
}

/**
 * Where on the physical screen the user is looking.
 *
 * @param detection A raw MediaPipe detection result.
 * @param calibration A partial calibration; absent fields fall back to their priors, an absent calibration uses the
 * priors alone.
 * @param options Eye signal, screen and video aspect.
 * @returns The gaze point in screen pixels (origin at the top left corner of the screen, +y down) with its distance
 * to the eyes in centimetres, or `null` when it cannot tell: no face, or a gaze that falls outside the screen.
 */
export function gazeToScreen(
  detection: GazeDetection,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): GazeScreenPoint | null {
  const screen = options.screen ?? getGazeScreen()

  const ray = gazeRay(detection, calibration, options)
  if (!ray) return null

  const point = gazeRayToScreen(ray, calibration, { ...options, screen })
  if (!point) return null

  const inside = point.x >= 0 && point.x <= screen.width && point.y >= 0 && point.y <= screen.height
  return inside ? point : null
}

/**
 * Converts a visual angle to a length on the screen: the radius, in screen pixels, of the disc that a cone of
 * `degrees` half-angle around the gaze draws on a screen `distance` centimetres away. It grows with the distance.
 *
 * The screen is taken as facing the gaze; pixels are taken as square.
 *
 * @param degrees The visual angle, in degrees.
 * @param distance Distance between the eyes and the gaze point in centimetres: `GazeScreenPoint.distance`.
 * @param calibration A partial calibration; only the width of the screen is read.
 * @param options Only `screen` is read.
 */
export function gazeDegreesToPixels(
  degrees: number,
  distance: number,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): number {
  return distance * Math.tan(toRadians(degrees)) * pixelsPerCentimetre(calibration, options)
}

/**
 * Converts a length on the screen to a visual angle: the reverse of `gazeDegreesToPixels`.
 *
 * @param pixels A length in screen pixels.
 * @param distance Distance between the eyes and the gaze point in centimetres: `GazeScreenPoint.distance`.
 * @param calibration A partial calibration; only the width of the screen is read.
 * @param options Only `screen` is read.
 * @returns The visual angle, in degrees.
 */
export function gazePixelsToDegrees(
  pixels: number,
  distance: number,
  calibration?: GazeCalibration,
  options: GazeModelOptions = {}
): number {
  return toDegrees(Math.atan(pixels / pixelsPerCentimetre(calibration, options) / distance))
}

//
// Internals
//

/** The pose of the head in the webcam frame: a rotation (unit axes), a uniform scale and a position (centimetres). */
type HeadPose = { x: GazeVector; y: GazeVector; z: GazeVector; scale: number; position: GazeVector }

/**
 * Reads the head matrix of the first face.
 *
 * MediaPipe computes it for a 63 degree vertical field of view. A face of a given size fills the same part of the
 * image at a distance inversely proportional to the tangent of half the field of view, so for another field of view
 * the depth of the head is rescaled; its sideways and upwards position, measured against the size of the face, holds.
 */
function headPose(detection: GazeDetection, fov: number): HeadPose | null {
  const m = detection.facialTransformationMatrixes?.[0]?.data
  if (!detection.faceLandmarks?.[0] || !m || m.length < 16) return null

  // column-major: columns are the head axes, then the translation
  const scale = Math.hypot(m[0], m[1], m[2])
  if (!(scale > 0)) return null

  const depth = Math.tan(toRadians(GAZE_MEDIAPIPE_FOV / 2)) / Math.tan(toRadians(fov / 2))

  return {
    x: [m[0] / scale, m[1] / scale, m[2] / scale],
    y: [m[4] / scale, m[5] / scale, m[6] / scale],
    z: [m[8] / scale, m[9] / scale, m[10] / scale],
    scale,
    position: [m[12], m[13], m[14] * depth],
  }
}

/** Rotates a vector of the head frame into the webcam frame. */
function rotate(head: HeadPose, [x, y, z]: GazeVector): GazeVector {
  return [
    head.x[0] * x + head.y[0] * y + head.z[0] * z,
    head.x[1] * x + head.y[1] * y + head.z[1] * z,
    head.x[2] * x + head.y[2] * y + head.z[2] * z,
  ]
}

/** Maps a point of the head frame to the webcam frame. */
function headToWebcam(head: HeadPose, point: GazeVector): GazeVector {
  const rotated = rotate(head, point)
  return [
    rotated[0] * head.scale + head.position[0],
    rotated[1] * head.scale + head.position[1],
    rotated[2] * head.scale + head.position[2],
  ]
}

/** The unit direction of eye angles in degrees: +z when both are zero. */
function anglesToDirection(yaw: number, pitch: number): GazeVector {
  const cosPitch = Math.cos(toRadians(pitch))
  return [Math.sin(toRadians(yaw)) * cosPitch, Math.sin(toRadians(pitch)), Math.cos(toRadians(yaw)) * cosPitch]
}

/** Eye angles from the `eyeLook*` blendshapes. */
function blendshapesAngles(detection: GazeDetection): GazeEyeAngles | null {
  const categories = detection.faceBlendshapes?.[0]?.categories
  if (!categories) return null

  const scores: Record<string, number> = {}
  for (const category of categories) {
    if (category.categoryName.startsWith('eyeLook')) scores[category.categoryName] = category.score
  }

  const { eyeLookInLeft, eyeLookOutLeft, eyeLookUpLeft, eyeLookDownLeft } = scores
  const { eyeLookInRight, eyeLookOutRight, eyeLookUpRight, eyeLookDownRight } = scores
  for (const score of [eyeLookInLeft, eyeLookOutLeft, eyeLookUpLeft, eyeLookDownLeft]) {
    if (score === undefined) return null
  }
  for (const score of [eyeLookInRight, eyeLookOutRight, eyeLookUpRight, eyeLookDownRight]) {
    if (score === undefined) return null
  }

  // "Left" and "right" are the eyes of the user. Looking to the left turns the left eye out and the right eye in.
  const yawLeft = eyeLookOutLeft - eyeLookInLeft
  const yawRight = eyeLookInRight - eyeLookOutRight
  const pitchLeft = eyeLookUpLeft - eyeLookDownLeft
  const pitchRight = eyeLookUpRight - eyeLookDownRight

  return {
    yaw: ((yawLeft + yawRight) / 2) * GAZE_BLENDSHAPES_RANGE.yaw,
    pitch: ((pitchLeft + pitchRight) / 2) * GAZE_BLENDSHAPES_RANGE.pitch,
  }
}

/**
 * Eye angles from the iris landmarks.
 *
 * Each iris centre is seen along a ray of the webcam. The ray is intersected with the eyeball, a sphere whose centre
 * is known from the head pose; the direction from the centre of the eyeball to that point is the gaze of that eye.
 */
function irisAngles(
  detection: GazeDetection,
  head: HeadPose,
  fov: number,
  options: GazeModelOptions
): GazeEyeAngles | null {
  const landmarks = detection.faceLandmarks[0]
  const left = landmarks[GAZE_IRIS_LANDMARKS.left]
  const right = landmarks[GAZE_IRIS_LANDMARKS.right]
  if (!left || !right) return null

  const tanVertical = Math.tan(toRadians(fov / 2))
  const tanHorizontal = tanVertical * (options.aspect ?? 4 / 3)

  let yaw = 0
  let pitch = 0
  for (const [iris, eye] of [
    [left, GAZE_EYE_CENTERS.left],
    [right, GAZE_EYE_CENTERS.right],
  ] as const) {
    // the ray of the webcam through the landmark; the image has its origin at the top left, +y down
    const ray: GazeVector = [(iris.x * 2 - 1) * tanHorizontal, -(iris.y * 2 - 1) * tanVertical, -1]
    const center = headToWebcam(head, eye)

    // the point of the ray closest to the centre of the eyeball, then back along the ray to the near side of the
    // sphere; a ray that misses the sphere (noise) keeps the closest point
    const raySquared = dot(ray, ray)
    let along = dot(center, ray) / raySquared
    const missSquared = dot(center, center) - along * along * raySquared
    const radius = GAZE_EYE_RADIUS * head.scale
    if (missSquared < radius * radius) along -= Math.sqrt((radius * radius - missSquared) / raySquared)

    // from the centre of the eyeball to the iris, in the head frame
    const toIris: GazeVector = [ray[0] * along - center[0], ray[1] * along - center[1], ray[2] * along - center[2]]
    const length = Math.hypot(toIris[0], toIris[1], toIris[2])
    if (!(length > 0)) return null
    const inHead: GazeVector = [
      dot(toIris, head.x) / length,
      dot(toIris, head.y) / length,
      dot(toIris, head.z) / length,
    ]

    yaw += toDegrees(Math.atan2(inHead[0], inHead[2])) / 2
    pitch += toDegrees(Math.asin(Math.max(-1, Math.min(1, inHead[1])))) / 2
  }

  return { yaw, pitch }
}

/** CSS pixels per centimetre of the physical screen, measured along its width. */
function pixelsPerCentimetre(calibration: GazeCalibration | undefined, options: GazeModelOptions): number {
  const screen = options.screen ?? getGazeScreen()
  return screen.width / resolveGazeCalibration(calibration, screen).screen.width
}

function dot(a: GazeVector, b: GazeVector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/** Freezes a plain object and everything in it, so the exported presets and constants are read-only at runtime too. */
function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
