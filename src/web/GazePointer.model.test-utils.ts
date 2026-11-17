//
// Test-only synthetic generator: the reverse of the gaze model.
//
// Given a calibration, a head pose and a point of the screen, it produces the MediaPipe detection of a face looking
// at that point, so that the model, run on it with the same calibration and options, returns the point.
//
// Frames and units are those of `GazePointer.model.ts`.
//

import {
  GAZE_BLENDSHAPES_RANGE,
  GAZE_EYE_CENTERS,
  GAZE_EYE_RADIUS,
  GAZE_IRIS_LANDMARKS,
  GAZE_MEDIAPIPE_FOV,
  resolveGazeCalibration,
  type GazeCalibration,
  type GazeDetection,
  type GazeScreen,
  type GazeVector,
} from './GazePointer.model'

/** The 52 blendshapes of MediaPipe's Face Landmarker, in the order it outputs them. */
const BLENDSHAPES = [
  '_neutral',
  'browDownLeft',
  'browDownRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  'cheekPuff',
  'cheekSquintLeft',
  'cheekSquintRight',
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'eyeLookDownLeft',
  'eyeLookDownRight',
  'eyeLookInLeft',
  'eyeLookInRight',
  'eyeLookOutLeft',
  'eyeLookOutRight',
  'eyeLookUpLeft',
  'eyeLookUpRight',
  'eyeSquintLeft',
  'eyeSquintRight',
  'eyeWideLeft',
  'eyeWideRight',
  'jawForward',
  'jawLeft',
  'jawOpen',
  'jawRight',
  'mouthClose',
  'mouthDimpleLeft',
  'mouthDimpleRight',
  'mouthFrownLeft',
  'mouthFrownRight',
  'mouthFunnel',
  'mouthLeft',
  'mouthLowerDownLeft',
  'mouthLowerDownRight',
  'mouthPressLeft',
  'mouthPressRight',
  'mouthPucker',
  'mouthRight',
  'mouthRollLower',
  'mouthRollUpper',
  'mouthShrugLower',
  'mouthShrugUpper',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthStretchLeft',
  'mouthStretchRight',
  'mouthUpperUpLeft',
  'mouthUpperUpRight',
  'noseSneerLeft',
  'noseSneerRight',
] as const

/** Radius of an iris in centimetres, for the four landmarks around each iris centre. */
const IRIS_RADIUS = 0.585

/** What to synthesise. */
export type SyntheticGazeInput = {
  /** The point of the screen the face looks at, in screen pixels (origin at the top left corner, +y down). */
  target: { x: number; y: number }
  /** The calibration the face is seen under. Absent fields fall back to their priors, as in the model. */
  calibration?: GazeCalibration
  /** Size of the physical screen in CSS pixels. Default: 1920 x 1080. */
  screen?: GazeScreen
  /** Width over height of the video. Default: 4/3. */
  aspect?: number
  /** The pose of the head. */
  head?: {
    /** True position of the origin of the head in the webcam frame, in centimetres. Default: `[0, -12, -55]`. */
    position?: GazeVector
    /**
     * Rotation of the head in degrees: `yaw` to the left of the user, `pitch` up, `roll` about the axis out of the
     * face, counter-clockwise as the webcam sees it (applied in the order roll, pitch, yaw).
     * Default: none, the face is turned to the webcam.
     */
    rotation?: readonly [yaw: number, pitch: number, roll: number]
  }
  /** Gaussian noise added to the signals. Default: none. */
  noise?: {
    /** Standard deviation added to every blendshape score (scores are between 0 and 1). */
    blendshapes?: number
    /** Standard deviation added to the `x` and `y` of every landmark (normalised to the image). */
    landmarks?: number
    /** Seed of the pseudo-random sequence, so a noisy fixture is reproducible. Default: 1. */
    seed?: number
  }
}

/**
 * Produces the detection result of a face looking at a known point of the screen.
 *
 * Both eye signals are written and agree: the `eyeLook*` blendshapes, and the iris landmarks (468 to 477) of two
 * parallel eyes. The other landmarks are placeholders at the image position of the origin of the head.
 *
 * @throws When the target needs the eyes to turn further than a full blendshape score can express.
 */
export function synthesizeGaze(input: SyntheticGazeInput): GazeDetection {
  const { target, aspect = 4 / 3, noise = {} } = input
  const screen = input.screen ?? { width: 1920, height: 1080 }
  const calibration = resolveGazeCalibration(input.calibration, screen)
  const position = input.head?.position ?? [0, -12, -55]
  const [headYaw, headPitch, headRoll] = input.head?.rotation ?? [0, 0, 0]
  const random = gaussian(noise.seed ?? 1)

  // The axes of the head in the webcam frame.
  const axes = headAxes(headYaw, headPitch, headRoll)
  const toWebcam = (point: GazeVector): GazeVector => add(position, rotate(axes, point))

  // The target in the webcam frame: from the middle of the top edge, along the right and the down of the screen.
  const tilt = radians(calibration.screen.tilt)
  const across = (target.x / screen.width - 0.5) * calibration.screen.width
  const along = (target.y / screen.height) * calibration.screen.height
  const targetInWebcam: GazeVector = [
    calibration.screen.offset[0] - across,
    calibration.screen.offset[1] - along * Math.cos(tilt),
    calibration.screen.offset[2] - along * Math.sin(tilt),
  ]

  // The eye angles that point from between the eyes to the target, then without the per-user correction.
  const leftEye = toWebcam(GAZE_EYE_CENTERS.left)
  const rightEye = toWebcam(GAZE_EYE_CENTERS.right)
  const between = scale(add(leftEye, rightEye), 0.5)
  const toTarget = normalize(subtract(targetInWebcam, between))
  const inHead: GazeVector = [dot(toTarget, axes[0]), dot(toTarget, axes[1]), dot(toTarget, axes[2])]
  const yaw = (degrees(Math.atan2(inHead[0], inHead[2])) - calibration.eyes.offset[0]) / calibration.eyes.gain[0]
  const pitch = (degrees(Math.asin(inHead[1])) - calibration.eyes.offset[1]) / calibration.eyes.gain[1]

  // Blendshapes.
  const sideways = Math.abs(yaw) / GAZE_BLENDSHAPES_RANGE.yaw
  const upwards = Math.abs(pitch) / GAZE_BLENDSHAPES_RANGE.pitch
  if (sideways > 1 || upwards > 1) {
    throw new Error(`synthesizeGaze: the target needs eye angles out of range (yaw ${yaw}, pitch ${pitch})`)
  }
  const scores: Record<string, number> = {
    // looking to the left turns the left eye out and the right eye in
    [yaw >= 0 ? 'eyeLookOutLeft' : 'eyeLookInLeft']: sideways,
    [yaw >= 0 ? 'eyeLookInRight' : 'eyeLookOutRight']: sideways,
    [pitch >= 0 ? 'eyeLookUpLeft' : 'eyeLookDownLeft']: upwards,
    [pitch >= 0 ? 'eyeLookUpRight' : 'eyeLookDownRight']: upwards,
  }
  const categories = BLENDSHAPES.map((categoryName, index) => ({
    index,
    categoryName,
    displayName: '',
    score: (scores[categoryName] ?? 0) + random() * (noise.blendshapes ?? 0),
  }))

  // Landmarks: a pinhole camera with the real field of view of the webcam.
  const tanVertical = Math.tan(radians(calibration.webcam.fov / 2))
  const tanHorizontal = tanVertical * aspect
  const project = ([x, y, z]: GazeVector) => ({
    x: 0.5 + x / -z / (2 * tanHorizontal) + random() * (noise.landmarks ?? 0),
    y: 0.5 - y / -z / (2 * tanVertical) + random() * (noise.landmarks ?? 0),
    z: 0,
    visibility: 0,
  })

  const faceLandmarks = Array.from({ length: 478 }, () => project(position))
  const gaze = rotate(axes, anglesToDirection(yaw, pitch))
  for (const [center, eye] of [
    [GAZE_IRIS_LANDMARKS.left, leftEye],
    [GAZE_IRIS_LANDMARKS.right, rightEye],
  ] as const) {
    const iris = add(eye, scale(gaze, GAZE_EYE_RADIUS))
    faceLandmarks[center] = project(iris)
    // the four points around the iris: towards +x, +y, -x and -y of the head
    faceLandmarks[center + 1] = project(add(iris, scale(axes[0], IRIS_RADIUS)))
    faceLandmarks[center + 2] = project(add(iris, scale(axes[1], IRIS_RADIUS)))
    faceLandmarks[center + 3] = project(add(iris, scale(axes[0], -IRIS_RADIUS)))
    faceLandmarks[center + 4] = project(add(iris, scale(axes[1], -IRIS_RADIUS)))
  }

  // The matrix, as MediaPipe would compute it: it assumes its own field of view, so it sees the head at a depth
  // that differs from the true one by the ratio of the tangents of the half fields of view.
  const depth = tanVertical / Math.tan(radians(GAZE_MEDIAPIPE_FOV / 2))
  const data = [...axes[0], 0, ...axes[1], 0, ...axes[2], 0, position[0], position[1], position[2] * depth, 1]

  return {
    faceLandmarks: [faceLandmarks],
    faceBlendshapes: [{ categories }],
    facialTransformationMatrixes: [{ data }],
  }
}

/** The x, y and z axes of a head turned by `yaw`, `pitch` and `roll` degrees, in the webcam frame. */
function headAxes(yaw: number, pitch: number, roll: number): [GazeVector, GazeVector, GazeVector] {
  const [cy, sy] = [Math.cos(radians(yaw)), Math.sin(radians(yaw))]
  const [cp, sp] = [Math.cos(radians(pitch)), Math.sin(radians(pitch))]
  const [cr, sr] = [Math.cos(radians(roll)), Math.sin(radians(roll))]

  // roll about z, then pitch about x (positive up), then yaw about y
  const turn = ([x, y, z]: GazeVector): GazeVector => {
    const rolled: GazeVector = [x * cr - y * sr, x * sr + y * cr, z]
    const pitched: GazeVector = [rolled[0], rolled[1] * cp + rolled[2] * sp, -rolled[1] * sp + rolled[2] * cp]
    return [pitched[0] * cy + pitched[2] * sy, pitched[1], -pitched[0] * sy + pitched[2] * cy]
  }

  return [turn([1, 0, 0]), turn([0, 1, 0]), turn([0, 0, 1])]
}

function anglesToDirection(yaw: number, pitch: number): GazeVector {
  const cosPitch = Math.cos(radians(pitch))
  return [Math.sin(radians(yaw)) * cosPitch, Math.sin(radians(pitch)), Math.cos(radians(yaw)) * cosPitch]
}

/** Combines the head-frame coordinates of a vector with the axes of the head. */
function rotate(axes: readonly [GazeVector, GazeVector, GazeVector], [x, y, z]: GazeVector): GazeVector {
  return add(add(scale(axes[0], x), scale(axes[1], y)), scale(axes[2], z))
}

function add(a: GazeVector, b: GazeVector): GazeVector {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function subtract(a: GazeVector, b: GazeVector): GazeVector {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function scale(a: GazeVector, factor: number): GazeVector {
  return [a[0] * factor, a[1] * factor, a[2] * factor]
}

function dot(a: GazeVector, b: GazeVector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function normalize(a: GazeVector): GazeVector {
  return scale(a, 1 / Math.hypot(a[0], a[1], a[2]))
}

function radians(value: number): number {
  return (value * Math.PI) / 180
}

function degrees(value: number): number {
  return (value * 180) / Math.PI
}

/** A reproducible source of normally distributed numbers (mulberry32, then Box-Muller). */
function gaussian(seed: number): () => number {
  let state = seed >>> 0
  const uniform = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return () => Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform())
}
