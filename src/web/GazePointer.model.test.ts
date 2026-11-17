import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { describe, expect, it } from 'vitest'
import {
  GAZE_EYE_CENTERS,
  GAZE_EYE_RADIUS,
  GazePointerDefaults,
  gazeDegreesToPixels,
  gazeEyeAngles,
  gazePixelsToDegrees,
  gazeRay,
  gazeRayToScreen,
  gazeToScreen,
  getGazeScreen,
  resolveGazeCalibration,
  type GazeCalibration,
  type GazeDetection,
} from './GazePointer.model'
import { synthesizeGaze } from './GazePointer.model.test-utils'

const rad = (degrees: number) => (degrees * Math.PI) / 180

//
// Fixtures built by hand, from geometry worked out here and not from the synthetic generator.
//
// Setup: a 40 x 25 cm screen of 1600 x 1000 px (40 px per cm), the webcam on the middle of its top edge, not tilted,
// with MediaPipe's own field of view (63 degrees), so the matrix is taken as is.
// The head is upright and faces the webcam; it is placed so that the point between the eyes is 10 cm below the
// webcam and 50 cm in front of the screen.
//

const screen = { width: 1600, height: 1000 }
const calibration = { screen: { width: 40, height: 25, offset: [0, 0, 0], tilt: 0 }, webcam: { fov: 63 } } as const

/** Where the point between the eyes sits, in the webcam frame (centimetres). */
const eyes = [0, -10, -50] as const

/** An identity rotation, and the translation that brings the point between the eyes of the canonical head to `eyes`. */
const matrix = {
  // column-major
  data: [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    eyes[0],
    eyes[1] - GAZE_EYE_CENTERS.left[1],
    eyes[2] - GAZE_EYE_CENTERS.left[2],
    1,
  ],
}

function blendshapes(scores: Record<string, number>) {
  return { categories: Object.entries(scores).map(([categoryName, score]) => ({ categoryName, score })) }
}

const neutral = {
  eyeLookInLeft: 0,
  eyeLookOutLeft: 0,
  eyeLookUpLeft: 0,
  eyeLookDownLeft: 0,
  eyeLookInRight: 0,
  eyeLookOutRight: 0,
  eyeLookUpRight: 0,
  eyeLookDownRight: 0,
}

function detection(scores: Partial<typeof neutral> = {}): GazeDetection {
  return {
    faceLandmarks: [[]],
    faceBlendshapes: [blendshapes({ ...neutral, ...scores })],
    facialTransformationMatrixes: [matrix],
  }
}

describe('gazeToScreen, blendshapes signal, geometry worked out by hand', () => {
  it('finds the point of the screen facing the eyes when they look straight ahead', () => {
    const point = gazeToScreen(detection(), calibration, { screen })

    // straight ahead of the eyes: the middle of the width, 10 cm below the top edge
    expect(point?.x).toBeCloseTo(800, 6)
    expect(point?.y).toBeCloseTo(10 * 40, 6)
    expect(point?.distance).toBeCloseTo(50, 6)
  })

  it('moves to the left of the screen when both eyes turn to the left of the user', () => {
    // a full `eyeLook` score is 50 degrees sideways: 0.4 is 20 degrees
    const point = gazeToScreen(detection({ eyeLookOutLeft: 0.4, eyeLookInRight: 0.4 }), calibration, { screen })

    // 50 cm away, 20 degrees sideways: 50 * tan(20) cm to the left of the middle
    expect(point?.x).toBeCloseTo((20 - 50 * Math.tan(rad(20))) * 40, 6)
    expect(point?.y).toBeCloseTo(400, 6)
    expect(point?.distance).toBeCloseTo(50 / Math.cos(rad(20)), 6)
  })

  it('moves to the right of the screen when both eyes turn to the right of the user', () => {
    const point = gazeToScreen(detection({ eyeLookInLeft: 0.2, eyeLookOutRight: 0.2 }), calibration, { screen })

    expect(point?.x).toBeCloseTo((20 + 50 * Math.tan(rad(10))) * 40, 6)
    expect(point?.y).toBeCloseTo(400, 6)
  })

  it('moves up when the eyes look up, down when they look down', () => {
    // a full `eyeLook` score is 45 degrees up or down: 0.2 is 9 degrees
    const up = gazeToScreen(detection({ eyeLookUpLeft: 0.2, eyeLookUpRight: 0.2 }), calibration, { screen })
    const down = gazeToScreen(detection({ eyeLookDownLeft: 0.2, eyeLookDownRight: 0.2 }), calibration, { screen })

    expect(up?.x).toBeCloseTo(800, 6)
    expect(up?.y).toBeCloseTo((10 - 50 * Math.tan(rad(9))) * 40, 6)
    expect(down?.y).toBeCloseTo((10 + 50 * Math.tan(rad(9))) * 40, 6)
  })

  it('averages the two eyes', () => {
    // left eye 20 degrees to the left, right eye straight: 10 degrees
    const point = gazeToScreen(detection({ eyeLookOutLeft: 0.4 }), calibration, { screen })

    expect(point?.x).toBeCloseTo((20 - 50 * Math.tan(rad(10))) * 40, 6)
  })

  it('follows the head when it turns, the eyes staying straight in it', () => {
    // the head turned 15 degrees to its left around the vertical axis, about the point between the eyes
    const [c, s] = [Math.cos(rad(15)), Math.sin(rad(15))]
    const [, cy, cz] = GAZE_EYE_CENTERS.left
    const turned = {
      // column-major: x axis, y axis, z axis, then the translation that keeps the point between the eyes in place
      data: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, eyes[0] - s * cz, eyes[1] - cy, eyes[2] - c * cz, 1],
    }
    const point = gazeToScreen({ ...detection(), facialTransformationMatrixes: [turned] }, calibration, { screen })

    // +x of the webcam frame is the left of the user, which is the left of the screen
    expect(point?.x).toBeCloseTo((20 - 50 * Math.tan(rad(15))) * 40, 6)
    expect(point?.y).toBeCloseTo(400, 6)
  })

  it('applies the per-user gain and offset to the eye angles', () => {
    const corrected = { ...calibration, eyes: { gain: [0.5, 2], offset: [-5, 1] } } as const
    const point = gazeToScreen(
      detection({ eyeLookOutLeft: 0.4, eyeLookInRight: 0.4, eyeLookUpLeft: 0.1, eyeLookUpRight: 0.1 }),
      corrected,
      { screen }
    )

    // sideways: 20 * 0.5 - 5 = 5 degrees to the left; upwards: 4.5 * 2 + 1 = 10 degrees
    const [yaw, pitch] = [rad(5), rad(10)]
    // the direction has an upward slope of tan(pitch) over its horizontal run, itself turned by yaw
    expect(point?.x).toBeCloseTo((20 - 50 * Math.tan(yaw)) * 40, 6)
    expect(point?.y).toBeCloseTo((10 - (50 / Math.cos(yaw)) * Math.tan(pitch)) * 40, 6)
  })
})

describe('gazeToScreen, screen placement, geometry worked out by hand', () => {
  it('shifts the point when the screen is not where the webcam is', () => {
    // the middle of the top edge of the screen is 3 cm to the right of the user and 12 cm below the webcam,
    // and the screen is 5 cm behind the webcam
    const shifted = { ...calibration, screen: { ...calibration.screen, offset: [-3, -12, 5] } } as const
    const point = gazeToScreen(detection(), shifted, { screen })

    // the eyes are 3 cm to the left of the middle and 2 cm above the top edge: off the screen
    expect(point).toBeNull()

    // looking 9 degrees down from 55 cm away brings the gaze back on it
    const down = gazeToScreen(detection({ eyeLookDownLeft: 0.2, eyeLookDownRight: 0.2 }), shifted, { screen })
    expect(down?.x).toBeCloseTo((20 - 3) * 40, 6)
    expect(down?.y).toBeCloseTo((55 * Math.tan(rad(9)) - 2) * 40, 6)
  })

  it('accounts for a webcam pitched down towards the user', () => {
    // The webcam is pitched down by 20 degrees, so in its frame the screen leans by 20 degrees.
    // The head is on the optical axis, 50 cm away, and looks straight back at the webcam.
    const tilted = { ...calibration, screen: { ...calibration.screen, tilt: 20 } } as const
    const [, cy, cz] = GAZE_EYE_CENTERS.left
    const onAxis = { data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -cy, -50 - cz, 1] }

    // looking at the webcam is looking at the top edge of the screen
    const atWebcam = gazeToScreen({ ...detection(), facialTransformationMatrixes: [onAxis] }, tilted, { screen })
    expect(atWebcam?.x).toBeCloseTo(800, 6)
    expect(atWebcam?.y).toBeCloseTo(0, 6)

    // Looking 9 degrees below the webcam: in the triangle webcam, eyes, gaze point, the angle at the eyes is 9 degrees
    // and the angle at the webcam is 90 - 20 degrees (the screen leans towards the optical axis), so the law of
    // sines gives the distance down the screen.
    const below = gazeToScreen(
      { ...detection({ eyeLookDownLeft: 0.2, eyeLookDownRight: 0.2 }), facialTransformationMatrixes: [onAxis] },
      tilted,
      { screen }
    )
    const down = (50 * Math.sin(rad(9))) / Math.sin(rad(180 - 9 - 70))
    expect(below?.y).toBeCloseTo(down * 40, 6)
  })
})

describe('gazeToScreen, iris signal, geometry worked out by hand', () => {
  // A 4:3 video seen through a 63 degree vertical field of view: a point (X, Y, Z) of the webcam frame lands at
  // 0.5 + X / -Z / (2 * tan(31.5) * 4 / 3) of the width and 0.5 - Y / -Z / (2 * tan(31.5)) of the height.
  const tan = Math.tan(rad(31.5))
  const project = ([x, y, z]: readonly number[]) => ({
    x: 0.5 + x / -z / (2 * tan * (4 / 3)),
    y: 0.5 - y / -z / (2 * tan),
    z: 0,
  })

  /** The landmarks of a face whose two irises are turned by `yaw` degrees to the left of the user. */
  function irises(yaw: number) {
    const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
    const [cx] = GAZE_EYE_CENTERS.left
    for (const [index, side] of [
      [468, -1], // right iris
      [473, 1], // left iris
    ]) {
      // each eyeball is centred `cx` cm on its side of the point between the eyes
      const center = [eyes[0] + side * cx, eyes[1], eyes[2]]
      landmarks[index] = project([
        center[0] + GAZE_EYE_RADIUS * Math.sin(rad(yaw)),
        center[1],
        center[2] + GAZE_EYE_RADIUS * Math.cos(rad(yaw)),
      ])
    }
    return landmarks
  }

  it('finds the point of the screen facing the eyes when the irises are centred', () => {
    const point = gazeToScreen({ ...detection(), faceLandmarks: [irises(0)] }, calibration, {
      screen,
      eyeSignal: 'iris',
      aspect: 4 / 3,
    })

    expect(point?.x).toBeCloseTo(800, 6)
    expect(point?.y).toBeCloseTo(400, 6)
  })

  it('moves to the left of the screen when the irises turn to the left of the user', () => {
    const point = gazeToScreen({ ...detection(), faceLandmarks: [irises(20)] }, calibration, {
      screen,
      eyeSignal: 'iris',
      aspect: 4 / 3,
    })

    expect(point?.x).toBeCloseTo((20 - 50 * Math.tan(rad(20))) * 40, 6)
    expect(point?.y).toBeCloseTo(400, 6)
  })
})

//
// From here on the synthetic generator is the ground truth: it builds the detection of a face looking at a known
// point, and the model must find that point back.
//

const signals = ['blendshapes', 'iris'] as const

const heads = [
  { name: 'facing the webcam', head: {} },
  { name: 'close, low and to one side', head: { position: [-9, -16, -38] } },
  { name: 'far and to the other side', head: { position: [14, -6, -85] } },
  { name: 'turned to its left', head: { rotation: [14, 0, 0] } },
  { name: 'turned to its right and nodding down', head: { rotation: [-11, -9, 0] } },
  { name: 'looking up with a roll', head: { position: [5, -14, -60], rotation: [4, 8, 12] } },
] as const

/** A grid of points over a screen, kept away from its border. */
function grid(size: { width: number; height: number }) {
  const points: { x: number; y: number }[] = []
  for (const v of [0.08, 0.5, 0.92])
    for (const u of [0.05, 0.35, 0.65, 0.95]) points.push({ x: u * size.width, y: v * size.height })
  return points
}

describe('gazeToScreen finds back the target of a synthetic face', () => {
  const desk = { width: 1920, height: 1080 }
  const laptop: GazeCalibration = {
    screen: { width: 34.5, height: 21.5, offset: [0.4, -0.8, 0.2], tilt: 6 },
    webcam: { fov: 52 },
    eyes: { gain: [0.8, 1.3], offset: [2, -3] },
  }

  for (const eyeSignal of signals) {
    for (const { name, head } of heads) {
      it(`${eyeSignal} signal, head ${name}`, () => {
        for (const target of grid(desk)) {
          const detection = synthesizeGaze({ target, calibration: laptop, screen: desk, aspect: 16 / 9, head })
          const point = gazeToScreen(detection, laptop, { eyeSignal, screen: desk, aspect: 16 / 9 })

          expect(point?.x).toBeCloseTo(target.x, 6)
          expect(point?.y).toBeCloseTo(target.y, 6)
        }
      })
    }
  }

  for (const eyeSignal of signals) {
    it(`${eyeSignal} signal, desktop preset on a desktop screen`, () => {
      for (const target of grid(desk)) {
        const detection = synthesizeGaze({ target, calibration: GazePointerDefaults.desktop, screen: desk })
        const point = gazeToScreen(detection, GazePointerDefaults.desktop, { eyeSignal, screen: desk })

        expect(point?.x).toBeCloseTo(target.x, 6)
        expect(point?.y).toBeCloseTo(target.y, 6)
      }
    })

    it(`${eyeSignal} signal, mobile preset on a phone in portrait`, () => {
      const phone = { width: 390, height: 844 }
      // a phone is held closer and lower than a desktop screen is looked at
      const head = { position: [1, -9, -30] } as const
      for (const target of grid(phone)) {
        const detection = synthesizeGaze({
          target,
          calibration: GazePointerDefaults.mobile,
          screen: phone,
          aspect: 3 / 4,
          head,
        })
        const point = gazeToScreen(detection, GazePointerDefaults.mobile, { eyeSignal, screen: phone, aspect: 3 / 4 })

        expect(point?.x).toBeCloseTo(target.x, 6)
        expect(point?.y).toBeCloseTo(target.y, 6)
      }
    })
  }

  it('uses the blendshapes signal by default', () => {
    const target = { x: 300, y: 700 }
    const detection = synthesizeGaze({ target, calibration: laptop, screen: desk })
    // without iris landmarks only the blendshapes can answer
    const withoutIrises = { ...detection, faceLandmarks: [detection.faceLandmarks[0].slice(0, 468)] }

    const point = gazeToScreen(withoutIrises, laptop, { screen: desk })
    expect(point?.x).toBeCloseTo(target.x, 6)
    expect(point?.y).toBeCloseTo(target.y, 6)
  })

  it('reads the two eye signals independently', () => {
    const target = { x: 1500, y: 200 }
    const detection = synthesizeGaze({ target, calibration: laptop, screen: desk })
    // without blendshapes only the irises can answer
    const withoutBlendshapes = { ...detection, faceBlendshapes: [] }

    const point = gazeToScreen(withoutBlendshapes, laptop, { eyeSignal: 'iris', screen: desk })
    expect(point?.x).toBeCloseTo(target.x, 6)
    expect(point?.y).toBeCloseTo(target.y, 6)
  })
})

describe('priors', () => {
  const desk = { width: 1920, height: 1080 }

  it('uses the desktop preset when there is no calibration', () => {
    const target = { x: 640, y: 480 }
    const detection = synthesizeGaze({ target, calibration: GazePointerDefaults.desktop, screen: desk })

    const point = gazeToScreen(detection, undefined, { screen: desk })
    expect(point?.x).toBeCloseTo(target.x, 6)
    expect(point?.y).toBeCloseTo(target.y, 6)
  })

  it('falls back to the prior of each field a partial calibration leaves out', () => {
    const target = { x: 1200, y: 300 }
    const partials: GazeCalibration[] = [
      {},
      { screen: { width: 60 } },
      { screen: { height: 20, tilt: 10 } },
      { screen: { offset: [0, 30, 0] } },
      { webcam: { fov: 75 } },
      { eyes: { gain: [0.7, 0.7] } },
      { eyes: { offset: [3, 3] }, residual: 1.5 },
    ]

    for (const partial of partials) {
      // the same face is expected whether the left out fields are absent or spelled out with the desktop preset
      const { desktop } = GazePointerDefaults
      const spelledOut: GazeCalibration = {
        screen: { ...desktop.screen, ...partial.screen },
        webcam: { ...desktop.webcam, ...partial.webcam },
        eyes: { ...desktop.eyes, ...partial.eyes },
      }
      const detection = synthesizeGaze({ target, calibration: spelledOut, screen: desk })

      for (const eyeSignal of signals) {
        const point = gazeToScreen(detection, partial, { eyeSignal, screen: desk })
        expect(point?.x).toBeCloseTo(target.x, 6)
        expect(point?.y).toBeCloseTo(target.y, 6)
      }
    }
  })

  it('estimates the size of the screen from its pixels and the density of the preset', () => {
    expect(resolveGazeCalibration(undefined, { width: 1600, height: 1000 }).screen).toMatchObject({
      width: 40,
      height: 25,
    })
    expect(resolveGazeCalibration(GazePointerDefaults.mobile, { width: 390, height: 840 }).screen).toMatchObject({
      width: 6.5,
      height: 14,
    })
  })

  it('resolves an absent calibration to the desktop preset', () => {
    const { desktop } = GazePointerDefaults
    expect(resolveGazeCalibration(undefined, desk)).toEqual({
      screen: {
        width: 1920 / desktop.screen.density,
        height: 1080 / desktop.screen.density,
        offset: desktop.screen.offset,
        tilt: desktop.screen.tilt,
      },
      webcam: desktop.webcam,
      eyes: desktop.eyes,
    })
  })

  it('keeps a full calibration as it is, with its residual', () => {
    const full = {
      screen: { width: 30, height: 20, offset: [1, 2, 3], tilt: 4 },
      webcam: { fov: 50 },
      eyes: { gain: [1.1, 0.9], offset: [-1, 1] },
      residual: 1.2,
    } as const
    expect(resolveGazeCalibration(full, desk)).toEqual(full)
  })

  it('exports read-only presets', () => {
    expect(Object.keys(GazePointerDefaults)).toEqual(['desktop', 'mobile'])
    expect(Object.isFrozen(GazePointerDefaults)).toBe(true)
    for (const preset of [GazePointerDefaults.desktop, GazePointerDefaults.mobile]) {
      expect(Object.isFrozen(preset)).toBe(true)
      expect(Object.isFrozen(preset.screen)).toBe(true)
      expect(Object.isFrozen(preset.screen.offset)).toBe(true)
      expect(Object.isFrozen(preset.eyes.gain)).toBe(true)
    }
  })

  it('reads the screen from the browser when it is asked, not when it is imported', () => {
    const globals = globalThis as { screen?: unknown }
    const before = globals.screen
    try {
      // node has no screen: a fallback is used
      delete globals.screen
      expect(getGazeScreen()).toEqual({ width: 1920, height: 1080 })

      // a browser screen appearing later is picked up
      globals.screen = { width: 1512, height: 982 }
      expect(getGazeScreen()).toEqual({ width: 1512, height: 982 })

      // and it is the default screen of the model
      const target = { x: 1000, y: 500 }
      const detection = synthesizeGaze({ target, screen: { width: 1512, height: 982 } })
      const point = gazeToScreen(detection)
      expect(point?.x).toBeCloseTo(target.x, 6)
      expect(point?.y).toBeCloseTo(target.y, 6)
    } finally {
      if (before === undefined) delete globals.screen
      else globals.screen = before
    }
  })
})

describe('when the model cannot tell', () => {
  const desk = { width: 1920, height: 1080 }
  const looking = synthesizeGaze({ target: { x: 960, y: 540 }, screen: desk })

  it('returns nothing without a face', () => {
    const empty = { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] }
    for (const eyeSignal of signals) {
      expect(gazeToScreen(empty, undefined, { eyeSignal, screen: desk })).toBeNull()
      expect(gazeRay(empty, undefined, { eyeSignal, screen: desk })).toBeNull()
      expect(gazeEyeAngles(empty, undefined, { eyeSignal })).toBeNull()
    }
  })

  it('returns nothing when the detection has no head matrix', () => {
    const { faceLandmarks, faceBlendshapes } = looking
    for (const eyeSignal of signals) {
      expect(gazeToScreen({ faceLandmarks, faceBlendshapes }, undefined, { eyeSignal, screen: desk })).toBeNull()
    }
  })

  it('returns nothing when the signal it is asked for is missing', () => {
    const { faceLandmarks, facialTransformationMatrixes } = looking
    expect(gazeToScreen({ faceLandmarks, facialTransformationMatrixes }, undefined, { screen: desk })).toBeNull()

    const withoutIrises = { ...looking, faceLandmarks: [faceLandmarks[0].slice(0, 468)] }
    expect(gazeToScreen(withoutIrises, undefined, { eyeSignal: 'iris', screen: desk })).toBeNull()
  })

  it('returns nothing when the gaze falls outside the screen, on each side', () => {
    for (const target of [
      { x: -40, y: 540 },
      { x: 1960, y: 540 },
      { x: 960, y: -40 },
      { x: 960, y: 1120 },
    ]) {
      const detection = synthesizeGaze({ target, screen: desk })
      for (const eyeSignal of signals) {
        expect(gazeToScreen(detection, undefined, { eyeSignal, screen: desk })).toBeNull()

        // the ray still exists, and its point on the plane of the screen is the target
        const ray = gazeRay(detection, undefined, { eyeSignal, screen: desk })
        const point = ray && gazeRayToScreen(ray, undefined, { screen: desk })
        expect(point?.x).toBeCloseTo(target.x, 6)
        expect(point?.y).toBeCloseTo(target.y, 6)
      }
    }
  })

  it('returns nothing when the head is turned away from the screen', () => {
    // a head turned by more than a quarter turn looks away from the plane of the screen
    const [c, s] = [Math.cos(rad(120)), Math.sin(rad(120))]
    const away = { data: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, -10, -50, 1] }
    const ray = gazeRay({ ...detection(), facialTransformationMatrixes: [away] }, calibration, { screen })

    expect(ray).not.toBeNull()
    expect(gazeRayToScreen(ray!, calibration, { screen })).toBeNull()
    expect(gazeToScreen({ ...detection(), facialTransformationMatrixes: [away] }, calibration, { screen })).toBeNull()
  })
})

describe('gazeRay', () => {
  it('starts between the eyes, in centimetres, and has a direction of length 1', () => {
    const ray = gazeRay(detection({ eyeLookOutLeft: 0.4, eyeLookInRight: 0.4 }), calibration, { screen })

    expect(ray?.origin[0]).toBeCloseTo(eyes[0], 9)
    expect(ray?.origin[1]).toBeCloseTo(eyes[1], 9)
    expect(ray?.origin[2]).toBeCloseTo(eyes[2], 9)
    // 20 degrees to the left of the user (+x), towards the webcam (+z)
    expect(ray?.direction[0]).toBeCloseTo(Math.sin(rad(20)), 9)
    expect(ray?.direction[1]).toBeCloseTo(0, 9)
    expect(ray?.direction[2]).toBeCloseTo(Math.cos(rad(20)), 9)
  })

  it('rescales the depth of the head for a webcam whose field of view is not the one MediaPipe assumes', () => {
    // MediaPipe sees the head 50 cm away through its 63 degrees; the same face fills the same part of a 90 degree
    // image when it is tan(31.5) / tan(45) times as far
    const wide = { ...calibration, webcam: { fov: 90 } }
    const onAxis = { data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -50, 1] }
    const ray = gazeRay({ ...detection(), facialTransformationMatrixes: [onAxis] }, wide, { screen })

    expect(ray?.origin[2]).toBeCloseTo(-50 * Math.tan(rad(31.5)) + GAZE_EYE_CENTERS.left[2], 9)
  })
})

describe('gazeEyeAngles', () => {
  it('gives the raw angles in degrees, before the correction of the calibration', () => {
    const corrected = { ...calibration, eyes: { gain: [0.5, 2], offset: [-5, 1] } } as const
    const angles = gazeEyeAngles(
      detection({ eyeLookInLeft: 0.1, eyeLookOutRight: 0.1, eyeLookUpLeft: 0.2, eyeLookUpRight: 0.2 }),
      corrected
    )

    // to the right of the user is a negative yaw, up is a positive pitch
    expect(angles?.yaw).toBeCloseTo(-5, 9)
    expect(angles?.pitch).toBeCloseTo(9, 9)
  })

  it('agrees between the two signals on a synthetic face', () => {
    const synthetic = synthesizeGaze({ target: { x: 200, y: 900 }, head: { rotation: [10, -5, 3] } })
    const fromBlendshapes = gazeEyeAngles(synthetic)
    const fromIrises = gazeEyeAngles(synthetic, undefined, { eyeSignal: 'iris' })

    expect(fromIrises?.yaw).toBeCloseTo(fromBlendshapes!.yaw, 6)
    expect(fromIrises?.pitch).toBeCloseTo(fromBlendshapes!.pitch, 6)
  })
})

describe('gazeDegreesToPixels', () => {
  // 40 pixels per centimetre
  const options = { screen }

  it('converts a visual angle to a radius on the screen', () => {
    // 2 degrees seen from 50 cm cover 50 * tan(2) cm
    expect(gazeDegreesToPixels(2, 50, calibration, options)).toBeCloseTo(50 * Math.tan(rad(2)) * 40, 9)
  })

  it('grows with the distance of the user', () => {
    const near = gazeDegreesToPixels(2, 40, calibration, options)
    const far = gazeDegreesToPixels(2, 80, calibration, options)

    expect(far).toBeCloseTo(near * 2, 9)
  })

  it('takes the distance of the gaze point the model returns', () => {
    const near = gazeToScreen(synthesizeGaze({ target: { x: 800, y: 500 }, calibration, screen }), calibration, options)
    const far = gazeToScreen(
      synthesizeGaze({ target: { x: 800, y: 500 }, calibration, screen, head: { position: [0, -12, -110] } }),
      calibration,
      options
    )

    expect(gazeDegreesToPixels(2, far!.distance, calibration, options)).toBeGreaterThan(
      gazeDegreesToPixels(2, near!.distance, calibration, options) * 1.9
    )
  })

  it('uses the priors when there is no calibration', () => {
    // the desktop preset has 40 pixels per centimetre
    expect(gazeDegreesToPixels(3, 60, undefined, { screen: { width: 1920, height: 1080 } })).toBeCloseTo(
      60 * Math.tan(rad(3)) * 40,
      9
    )
  })

  it('is reversed by gazePixelsToDegrees', () => {
    expect(
      gazePixelsToDegrees(gazeDegreesToPixels(3.5, 62, calibration, options), 62, calibration, options)
    ).toBeCloseTo(3.5, 9)
  })
})

describe('GazeDetection', () => {
  it('accepts a MediaPipe result as it is', () => {
    // checked by the compiler: a `FaceLandmarkerResult` needs no conversion
    const accept = (result: FaceLandmarkerResult): GazeDetection => result

    expect(accept({ faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] })).toBeDefined()
  })
})

describe('synthetic generator', () => {
  const desk = { width: 1920, height: 1080 }
  const target = { x: 700, y: 400 }

  it('produces a full detection: 478 landmarks, 52 blendshapes, one 4x4 matrix', () => {
    const synthetic = synthesizeGaze({ target, screen: desk })

    expect(synthetic.faceLandmarks[0]).toHaveLength(478)
    expect(synthetic.faceBlendshapes?.[0].categories).toHaveLength(52)
    expect(synthetic.facialTransformationMatrixes?.[0].data).toHaveLength(16)
  })

  it('adds noise that moves the gaze point by an amount that follows its level', () => {
    for (const eyeSignal of signals) {
      const errors = [0.002, 0.02].map((level) => {
        let sum = 0
        for (let seed = 1; seed <= 50; seed++) {
          const noise = { blendshapes: level, landmarks: level / 20, seed }
          const point = gazeRayToScreen(
            gazeRay(synthesizeGaze({ target, screen: desk, noise }), undefined, { eyeSignal, screen: desk })!,
            undefined,
            { screen: desk }
          )!
          sum += Math.hypot(point.x - target.x, point.y - target.y)
        }
        return sum / 50
      })

      expect(errors[0]).toBeGreaterThan(0.5)
      expect(errors[1]).toBeGreaterThan(errors[0] * 5)
      expect(errors[1]).toBeLessThan(errors[0] * 20)
    }
  })

  it('is reproducible for a given seed', () => {
    const noise = { blendshapes: 0.02, landmarks: 0.001, seed: 7 }

    expect(synthesizeGaze({ target, screen: desk, noise })).toEqual(synthesizeGaze({ target, screen: desk, noise }))
    expect(synthesizeGaze({ target, screen: desk, noise })).not.toEqual(
      synthesizeGaze({ target, screen: desk, noise: { ...noise, seed: 8 } })
    )
  })

  it('refuses a target the eyes cannot reach', () => {
    expect(() => synthesizeGaze({ target: { x: 40000, y: 400 }, screen: desk })).toThrow(/out of range/)
  })
})
