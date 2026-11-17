/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import {
  createContext,
  forwardRef,
  ReactNode,
  RefObject,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  ComponentRef,
} from 'react'
import type { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision'

import { VideoTexture, VideoTextureProps } from '../core/VideoTexture'
import { WebcamVideoTexture } from './WebcamVideoTexture'
import { useFaceLandmarker } from './FaceLandmarker'
import { createFaceTrackingStore, FaceTrackingListener } from './FaceTracking.store'

type VideoFrame = Parameters<FaceLandmarker['detectForVideo']>[0]

export type FaceTrackingProps = {
  /** VideoTexture or WebcamVideoTexture options */
  videoTexture?: VideoTextureProps
  /** Disable the automatic face-detection => you should provide `faceLandmarkerResult` yourself in this case */
  manualDetect?: boolean
  /** FaceLandmarker result, published as is when provided (it takes precedence over the automatic detection) */
  faceLandmarkerResult?: FaceLandmarkerResult
  /** The components sharing this webcam and this detection */
  children?: ReactNode
}

export type FaceTrackingApi = {
  /**
   * The latest raw detection result, `undefined` until a first one is available.
   * Meant to be read in the frame loop: a new result re-renders nothing.
   * Only the first detected face (index 0) is used by drei components.
   */
  getResult: () => FaceLandmarkerResult | undefined
  /** Be called with each new result. Returns the function that unsubscribes the listener. */
  subscribe: (listener: FaceTrackingListener) => () => void
  /** The video texture the detection runs on, `null` with `manualDetect` or while the video is not ready */
  videoTextureRef: RefObject<ComponentRef<typeof VideoTexture> | null>
}

const FaceTrackingContext = /* @__PURE__ */ createContext<FaceTrackingApi | null>(null)

/**
 * Shares one webcam and one face detection between its descendants.
 *
 * It owns the video texture, runs the detection once per video frame, and keeps the latest result outside
 * React state: read it with `useFaceTracking()`.
 *
 * Pre-requisite: wrap into a `FaceLandmarker` provider:
 *
 * ```jsx
 * <FaceLandmarker>
 *   <FaceTracking>...</FaceTracking>
 * </FaceLandmarker>
 * ```
 */
export const FaceTracking = /* @__PURE__ */ forwardRef<FaceTrackingApi, FaceTrackingProps>(
  ({ videoTexture = { start: true }, manualDetect = false, faceLandmarkerResult, children }, fref) => {
    //
    // A result provided from outside: readable from the first render, then published on each change
    //

    const [store] = useState(() => createFaceTrackingStore(faceLandmarkerResult))

    useEffect(() => {
      if (faceLandmarkerResult) store.publish(faceLandmarkerResult)
    }, [faceLandmarkerResult, store])

    //
    // onVideoFrame (only used if !manualDetect)
    //

    const videoTextureRef = useRef<ComponentRef<typeof VideoTexture>>(null)

    const faceLandmarker = useFaceLandmarker()
    const hasProvidedResult = faceLandmarkerResult !== undefined
    const onVideoFrame = useCallback<NonNullable<VideoTextureProps['onVideoFrame']>>(
      (now) => {
        if (hasProvidedResult) return // the provided result wins: no need to detect
        const texture = videoTextureRef.current
        if (!texture) return
        const videoFrame = texture.source.data as VideoFrame
        const result = faceLandmarker?.detectForVideo(videoFrame, now)
        store.publish(result)
      },
      [faceLandmarker, hasProvidedResult, store]
    )

    //
    // Ref API (also the context value)
    //

    const api = useMemo<FaceTrackingApi>(
      () => ({
        getResult: store.getResult,
        subscribe: store.subscribe,
        videoTextureRef,
      }),
      [store]
    )
    useImperativeHandle(fref, () => api, [api])

    //
    //
    //

    const videoTextureProps = { onVideoFrame, ...videoTexture }

    return (
      <FaceTrackingContext.Provider value={api}>
        {!manualDetect && (
          <Suspense fallback={null}>
            {'src' in videoTextureProps ? (
              <VideoTexture ref={videoTextureRef} {...videoTextureProps} />
            ) : (
              <WebcamVideoTexture ref={videoTextureRef} {...videoTextureProps} />
            )}
          </Suspense>
        )}

        {children}
      </FaceTrackingContext.Provider>
    )
  }
)

/**
 * The `FaceTracking` api of the closest provider above, or `null` when there is none.
 */
export const useFaceTracking = () => useContext(FaceTrackingContext)
