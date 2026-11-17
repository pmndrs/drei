import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'

/** Called with each published detection result (`undefined` when the detection gave nothing). */
export type FaceTrackingListener = (result: FaceLandmarkerResult | undefined) => void

/** Holds the latest face detection result outside React state, and tells subscribers when it changes. */
export type FaceTrackingStore = {
  /** The latest published result, `undefined` before the first publication */
  getResult: () => FaceLandmarkerResult | undefined
  /** Register a listener called on each publication. Returns the function that unsubscribes it. */
  subscribe: (listener: FaceTrackingListener) => () => void
  /** Replace the latest result and notify the subscribers */
  publish: (result: FaceLandmarkerResult | undefined) => void
}

/**
 * Create the store behind `FaceTracking`.
 *
 * It is plain JavaScript on purpose: publishing a result re-renders nothing, a consumer reads `getResult()`
 * in its frame loop or subscribes.
 *
 * @param initialResult a result already known at creation, readable before any publication
 */
export function createFaceTrackingStore(initialResult?: FaceLandmarkerResult): FaceTrackingStore {
  let latestResult = initialResult

  // One entry per `subscribe` call, so the same listener can be registered twice.
  type Subscription = { listener: FaceTrackingListener }
  const subscriptions = new Set<Subscription>()

  return {
    getResult: () => latestResult,

    subscribe: (listener) => {
      const subscription: Subscription = { listener }
      subscriptions.add(subscription)

      return () => {
        subscriptions.delete(subscription)
      }
    },

    publish: (result) => {
      latestResult = result

      // Iterate over a copy: a listener may unsubscribe while being notified.
      for (const subscription of Array.from(subscriptions)) {
        subscription.listener(result)
      }
    },
  }
}
