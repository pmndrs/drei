import { describe, expect, it } from 'vitest'

import { computeEyeRotation } from './Facemesh.eye'

// Distinct ranges, so a swap between the two axes cannot go unnoticed.
const fov = { horizontal: 100, vertical: 90 }

const DEG_50 = (50 * Math.PI) / 180 // half of the horizontal range
const DEG_45 = Math.PI / 4 // half of the vertical range

const none = { lookIn: 0, lookOut: 0, lookUp: 0, lookDown: 0 }

describe('computeEyeRotation', () => {
  it('does not rotate an eye that looks straight ahead', () => {
    const { pitch, yaw } = computeEyeRotation(none, 'left', fov)

    expect(pitch).toBeCloseTo(0)
    expect(yaw).toBeCloseTo(0)
  })

  it('yaws by half the horizontal range when the eye looks fully sideways', () => {
    const { pitch, yaw } = computeEyeRotation({ ...none, lookIn: 1 }, 'left', fov)

    expect(yaw).toBeCloseTo(DEG_50)
    expect(pitch).toBeCloseTo(0)
  })

  it('pitches by half the vertical range when the eye looks fully down', () => {
    const { pitch, yaw } = computeEyeRotation({ ...none, lookDown: 1 }, 'left', fov)

    expect(pitch).toBeCloseTo(DEG_45)
    expect(yaw).toBeCloseTo(0)
  })

  it('pitches the other way when the eye looks up', () => {
    const { pitch } = computeEyeRotation({ ...none, lookUp: 1 }, 'right', fov)

    expect(pitch).toBeCloseTo(-DEG_45)
  })

  it('yaws the other way when the eye looks out', () => {
    const { yaw } = computeEyeRotation({ ...none, lookOut: 1 }, 'left', fov)

    expect(yaw).toBeCloseTo(-DEG_50)
  })

  it('mirrors the yaw between the two sides, and not the pitch', () => {
    const scores = { lookIn: 1, lookOut: 0, lookUp: 0, lookDown: 1 }

    const left = computeEyeRotation(scores, 'left', fov)
    const right = computeEyeRotation(scores, 'right', fov)

    expect(left.yaw).toBeCloseTo(DEG_50)
    expect(right.yaw).toBeCloseTo(-DEG_50)
    expect(left.pitch).toBeCloseTo(DEG_45)
    expect(right.pitch).toBeCloseTo(DEG_45)
  })

  it('scales with partial scores', () => {
    const { pitch, yaw } = computeEyeRotation({ lookIn: 0.5, lookOut: 0.1, lookUp: 0.2, lookDown: 0.6 }, 'left', fov)

    expect(yaw).toBeCloseTo((20 * Math.PI) / 180) // 50deg * (0.5 - 0.1)
    expect(pitch).toBeCloseTo((18 * Math.PI) / 180) // 45deg * (0.6 - 0.2)
  })
})
