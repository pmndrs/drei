import * as THREE from '#three'
import { clamp, deltaAngle } from 'math'
import { spring, type Spring } from 'math/time'

// Damping helpers for drei's controls, ported from maath's `easing` module
// (pmndrs/maath, now pmndrs/math). The `math` package keeps the critically
// damped spring (`spring.damp`, same omega = 2 / smoothTime curve, solved
// exactly) but drops maath's maxSpeed clamp, eps snap, "still moving" return
// value and the three.js object variants, which drei's public props rely on.
//
// Differences from maath, all deliberate:
// - no `easing` argument; `spring.damp` uses the exact exponential instead of
//   maath's polynomial approximation
// - velocities live in a WeakMap instead of a `__damp` field on the object

const springs = /* @__PURE__ */ new WeakMap<object, Record<string, Spring<number>>>()

function getSpring(current: object, prop: string): Spring<number> {
  let state = springs.get(current)
  if (state === undefined) springs.set(current, (state = {}))
  return (state[prop] ??= spring.create())
}

/**
 * Damp, based on Game Programming Gems 4 Chapter 1.10
 *   Return value indicates whether the animation is still running.
 */
export function damp<K extends string>(
  /** The object */
  current: { [key in K]: number },
  /** The key to animate */
  prop: K,
  /** To goal value */
  target: number,
  smoothTime = 0.25,
  delta = 0.01,
  maxSpeed = Infinity,
  eps = 0.001
): boolean {
  const s = getSpring(current, prop)

  if (Math.abs(current[prop] - target) <= eps) {
    current[prop] = target
    return false
  }

  smoothTime = Math.max(0.0001, smoothTime)
  let change = current[prop] - target
  const originalTo = target
  // Clamp maximum maxSpeed
  const maxChange = maxSpeed * smoothTime
  change = clamp(change, -maxChange, maxChange)
  target = current[prop] - change
  s.value = current[prop]
  spring.damp(s, target, smoothTime, delta)
  let output = s.value
  // Prevent overshooting
  if (originalTo - current[prop] > 0.0 === output > originalTo) {
    output = originalTo
    s.velocity = (output - originalTo) / delta
  }
  current[prop] = output
  return true
}

/**
 * DampAngle, with a shortest-path
 */
export function dampAngle<K extends string>(
  current: { [key in K]: number },
  prop: K,
  target: number,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  eps?: number
): boolean {
  return damp(current, prop, current[prop] + deltaAngle(current[prop], target), smoothTime, delta, maxSpeed, eps)
}

/**
 * Vector3D Damp
 */
const v3d = /* @__PURE__ */ new THREE.Vector3()
let a3: boolean, b3: boolean, c3: boolean
export function damp3(
  current: THREE.Vector3,
  target: number | [x: number, y: number, z: number] | THREE.Vector3Like,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  eps?: number
): boolean {
  if (typeof target === 'number') v3d.setScalar(target)
  else if (Array.isArray(target)) v3d.set(target[0], target[1], target[2])
  else v3d.copy(target)
  a3 = damp(current, 'x', v3d.x, smoothTime, delta, maxSpeed, eps)
  b3 = damp(current, 'y', v3d.y, smoothTime, delta, maxSpeed, eps)
  c3 = damp(current, 'z', v3d.z, smoothTime, delta, maxSpeed, eps)
  return a3 || b3 || c3
}

/**
 * Euler Damp
 */
const rot = /* @__PURE__ */ new THREE.Euler()
let aE: boolean, bE: boolean, cE: boolean
export function dampE(
  current: THREE.Euler,
  target: [x: number, y: number, z: number, order?: THREE.EulerOrder] | THREE.Euler,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  eps?: number
): boolean {
  if (Array.isArray(target)) rot.set(target[0], target[1], target[2], target[3])
  else rot.copy(target)
  aE = dampAngle(current, 'x', rot.x, smoothTime, delta, maxSpeed, eps)
  bE = dampAngle(current, 'y', rot.y, smoothTime, delta, maxSpeed, eps)
  cE = dampAngle(current, 'z', rot.z, smoothTime, delta, maxSpeed, eps)
  return aE || bE || cE
}

/**
 * Quaternion Damp
 * https://gist.github.com/maxattack/4c7b4de00f5c1b95a33b
 * Copyright 2016 Max Kaufmann (max.kaufmann@gmail.com)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const qt = /* @__PURE__ */ new THREE.Quaternion()
const v4result = /* @__PURE__ */ new THREE.Vector4()
const v4velocity = /* @__PURE__ */ new THREE.Vector4()
const v4error = /* @__PURE__ */ new THREE.Vector4()
let aQ: boolean, bQ: boolean, cQ: boolean, dQ: boolean
export function dampQ(
  current: THREE.Quaternion,
  target: [x: number, y: number, z: number, w: number] | THREE.Quaternion,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  eps?: number
): boolean {
  const cur = current as unknown as { x: number; y: number; z: number; w: number }
  if (Array.isArray(target)) qt.set(target[0], target[1], target[2], target[3])
  else qt.copy(target)
  const multi = current.dot(qt) > 0 ? 1 : -1
  qt.x *= multi
  qt.y *= multi
  qt.z *= multi
  qt.w *= multi
  aQ = damp(cur, 'x', qt.x, smoothTime, delta, maxSpeed, eps)
  bQ = damp(cur, 'y', qt.y, smoothTime, delta, maxSpeed, eps)
  cQ = damp(cur, 'z', qt.z, smoothTime, delta, maxSpeed, eps)
  dQ = damp(cur, 'w', qt.w, smoothTime, delta, maxSpeed, eps)
  // smooth damp (nlerp approx)
  v4result.set(current.x, current.y, current.z, current.w).normalize()
  const sx = getSpring(cur, 'x')
  const sy = getSpring(cur, 'y')
  const sz = getSpring(cur, 'z')
  const sw = getSpring(cur, 'w')
  v4velocity.set(sx.velocity, sy.velocity, sz.velocity, sw.velocity)
  // ensure deriv is tangent
  v4error.copy(v4result).multiplyScalar(v4velocity.dot(v4result) / v4result.dot(v4result))
  sx.velocity -= v4error.x
  sy.velocity -= v4error.y
  sz.velocity -= v4error.z
  sw.velocity -= v4error.w
  current.set(v4result.x, v4result.y, v4result.z, v4result.w)
  return aQ || bQ || cQ || dQ
}

/**
 * DampLookAt
 */
const isCamera = (v: any): v is THREE.Camera => v && v.isCamera
const isLight = (v: any): v is THREE.Light => v && v.isLight
const vl3d = /* @__PURE__ */ new THREE.Vector3()
const _q1 = /* @__PURE__ */ new THREE.Quaternion()
const _q2 = /* @__PURE__ */ new THREE.Quaternion()
const _m1 = /* @__PURE__ */ new THREE.Matrix4()
const _position = /* @__PURE__ */ new THREE.Vector3()
export function dampLookAt(
  current: THREE.Object3D,
  target: number | [x: number, y: number, z: number] | THREE.Vector3Like,
  smoothTime?: number,
  delta?: number,
  maxSpeed?: number,
  eps?: number
): void {
  // This method does not support objects having non-uniformly-scaled parent(s)
  if (typeof target === 'number') vl3d.setScalar(target)
  else if (Array.isArray(target)) vl3d.set(target[0], target[1], target[2])
  else vl3d.copy(target)
  const parent = current.parent
  current.updateWorldMatrix(true, false)
  _position.setFromMatrixPosition(current.matrixWorld)
  if (isCamera(current) || isLight(current)) _m1.lookAt(_position, vl3d, current.up)
  else _m1.lookAt(vl3d, _position, current.up)
  dampQ(current.quaternion, _q2.setFromRotationMatrix(_m1), smoothTime, delta, maxSpeed, eps)
  if (parent) {
    _m1.extractRotation(parent.matrixWorld)
    _q1.setFromRotationMatrix(_m1)
    dampQ(current.quaternion, _q2.copy(current.quaternion).premultiply(_q1.invert()), smoothTime, delta, maxSpeed, eps)
  }
}
