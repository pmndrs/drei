import { describe, expect, it } from 'vitest'
import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three'
import { damp, damp3, dampE, dampLookAt } from './damp'

// Not wired into `yarn test` yet. Run with a node vitest config that maps the
// tsconfig aliases (`@utils`, `#three` -> three).

const dt = 1 / 60

describe('damp', () => {
  it('converges on the target and reports when it has settled', () => {
    const state = { offset: 0 }
    let frames = 0
    while (damp(state, 'offset', 1, 0.25, dt) && frames < 1000) frames++
    expect(state.offset).toBe(1)
    // matches maath 0.10.8, which settles on the same frame for these inputs
    expect(frames).toBe(70)
  })

  it('snaps to the target within eps and returns false', () => {
    const state = { offset: 0.9995 }
    expect(damp(state, 'offset', 1, 0.25, dt, Infinity, 0.001)).toBe(false)
    expect(state.offset).toBe(1)
  })

  it('limits the speed to maxSpeed', () => {
    const fast = { offset: 0 }
    const slow = { offset: 0 }
    for (let i = 0; i < 30; i++) {
      damp(fast, 'offset', 10, 0.25, dt)
      damp(slow, 'offset', 10, 0.25, dt, 1)
    }
    expect(slow.offset).toBeLessThan(0.5 + 1e-6)
    expect(fast.offset).toBeGreaterThan(slow.offset)
  })

  it('never overshoots the target', () => {
    const state = { offset: 0 }
    for (let i = 0; i < 300; i++) {
      damp(state, 'offset', 1, 0.1, 0.2)
      expect(state.offset).toBeLessThanOrEqual(1)
    }
  })
})

describe('damp3', () => {
  it('accepts a scalar target', () => {
    const scale = new Vector3(1, 1, 1)
    for (let i = 0; i < 300; i++) damp3(scale, 2, 0.1, dt)
    expect(scale.toArray()).toEqual([2, 2, 2])
  })
})

describe('dampE', () => {
  it('takes the shortest path across the ±π seam', () => {
    const rotation = new Euler(0, 3, 0)
    dampE(rotation, new Euler(0, -3, 0), 0.2, dt)
    // -3 is reached by going up through π, not down through 0
    expect(rotation.y).toBeGreaterThan(3)
  })
})

describe('dampLookAt', () => {
  it('turns an object under a rotated parent to face the target', () => {
    const parent = new Group()
    parent.rotation.set(0.3, 0.5, 0)
    const object = new Object3D()
    object.position.set(1, 2, 3)
    parent.add(object)
    parent.updateMatrixWorld()

    const focus = new Vector3(-4, 0, 1)
    for (let i = 0; i < 600; i++) dampLookAt(object, focus, 0.1, dt, Infinity, 1e-5)

    const expected = object.clone()
    parent.add(expected)
    expected.lookAt(focus)
    expect(Math.abs(object.quaternion.dot(expected.quaternion))).toBeCloseTo(1, 4)
    expect(object.quaternion).toBeInstanceOf(Quaternion)
  })
})
