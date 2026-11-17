import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { describe, expect, it } from 'vitest'
import { createFaceTrackingStore } from './FaceTracking.store'

/** A detection result that only needs to be told apart from another one. */
function makeResult(x: number): FaceLandmarkerResult {
  return {
    faceLandmarks: [[{ x, y: 0, z: 0, visibility: 0 }]],
    faceBlendshapes: [],
    facialTransformationMatrixes: [],
  }
}

describe('createFaceTrackingStore', () => {
  it('has no result before the first publication', () => {
    const store = createFaceTrackingStore()

    expect(store.getResult()).toBeUndefined()
  })

  it('starts from the initial result it is created with', () => {
    const initial = makeResult(1)
    const store = createFaceTrackingStore(initial)

    expect(store.getResult()).toBe(initial)
  })

  it('returns the latest published result', () => {
    const store = createFaceTrackingStore()
    const first = makeResult(1)
    const second = makeResult(2)

    store.publish(first)
    store.publish(second)

    expect(store.getResult()).toBe(second)
  })

  it('forgets the result when the detection publishes nothing', () => {
    const store = createFaceTrackingStore()

    store.publish(makeResult(1))
    store.publish(undefined)

    expect(store.getResult()).toBeUndefined()
  })

  it('notifies every subscriber with each published result, in order', () => {
    const store = createFaceTrackingStore()
    const first = makeResult(1)
    const second = makeResult(2)
    const seenByA: unknown[] = []
    const seenByB: unknown[] = []

    store.subscribe((result) => seenByA.push(result))
    store.subscribe((result) => seenByB.push(result))
    store.publish(first)
    store.publish(second)

    expect(seenByA).toEqual([first, second])
    expect(seenByB).toEqual([first, second])
  })

  it('exposes the new result to a subscriber reading the store while notified', () => {
    const store = createFaceTrackingStore()
    const result = makeResult(1)
    const read: unknown[] = []

    store.subscribe(() => read.push(store.getResult()))
    store.publish(result)

    expect(read).toEqual([result])
  })

  it('does not replay the latest result to a late subscriber', () => {
    const store = createFaceTrackingStore()
    const seen: unknown[] = []

    store.publish(makeResult(1))
    store.subscribe((result) => seen.push(result))

    expect(seen).toEqual([])
  })

  it('stops notifying a subscriber once unsubscribed, and keeps notifying the others', () => {
    const store = createFaceTrackingStore()
    const first = makeResult(1)
    const second = makeResult(2)
    const seenByA: unknown[] = []
    const seenByB: unknown[] = []

    const unsubscribeA = store.subscribe((result) => seenByA.push(result))
    store.subscribe((result) => seenByB.push(result))
    store.publish(first)
    unsubscribeA()
    store.publish(second)

    expect(seenByA).toEqual([first])
    expect(seenByB).toEqual([first, second])
  })

  it('still notifies the other subscribers when one unsubscribes while notified', () => {
    const store = createFaceTrackingStore()
    const result = makeResult(1)
    const seenByB: unknown[] = []

    const unsubscribeA = store.subscribe(() => unsubscribeA())
    store.subscribe((value) => seenByB.push(value))
    store.publish(result)

    expect(seenByB).toEqual([result])
  })

  it('keeps one subscription per subscribe call, even for the same listener', () => {
    const store = createFaceTrackingStore()
    const seen: unknown[] = []
    const listener = (result: unknown) => seen.push(result)

    const unsubscribeFirst = store.subscribe(listener)
    store.subscribe(listener)
    unsubscribeFirst()
    store.publish(makeResult(1))

    expect(seen).toHaveLength(1)
  })
})
