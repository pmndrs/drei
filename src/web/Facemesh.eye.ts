//
// Pure eye maths of <Facemesh>, kept free of React and three.js so it can be unit tested under node.
//

const DEG2RAD = Math.PI / 180

/** The four MediaPipe `eyeLook*` blendshape scores of one eye, each in [0, 1]. */
export type FacemeshEyeLookScores = {
  /** `eyeLookIn*`: the eye looks towards the nose */
  lookIn: number
  /** `eyeLookOut*`: the eye looks away from the nose */
  lookOut: number
  /** `eyeLookUp*` */
  lookUp: number
  /** `eyeLookDown*` */
  lookDown: number
}

/** The full angular ranges of an eye, in degrees. */
export type FacemeshEyeFov = {
  /** Range covered from fully looking in to fully looking out */
  horizontal: number
  /** Range covered from fully looking up to fully looking down */
  vertical: number
}

/** The rotation of an eye, in radians. */
export type FacemeshEyeRotation = {
  /** Rotation around the x axis: positive looks down */
  pitch: number
  /** Rotation around the y axis: mirrored between the two sides */
  yaw: number
}

/**
 * Map the `eyeLook*` scores of one eye to its rotation.
 *
 * A score of 1 rotates the eye by half of the matching range.
 */
export function computeEyeRotation(
  scores: FacemeshEyeLookScores,
  side: 'left' | 'right',
  fov: FacemeshEyeFov
): FacemeshEyeRotation {
  const hfov = fov.horizontal * DEG2RAD
  const vfov = fov.vertical * DEG2RAD

  const pitch = vfov * 0.5 * (scores.lookDown - scores.lookUp)
  const yaw = hfov * 0.5 * (scores.lookIn - scores.lookOut) * (side === 'left' ? 1 : -1)

  return { pitch, yaw }
}
