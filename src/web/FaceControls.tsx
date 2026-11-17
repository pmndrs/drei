/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useMemo,
  useImperativeHandle,
  RefObject,
  createContext,
  useContext,
  useSyncExternalStore,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { easing } from 'maath'

import { VideoTextureProps } from '../core/VideoTexture'
import { Facemesh, FacemeshApi, FacemeshProps } from './Facemesh'
import { FaceTracking, FaceTrackingApi, useFaceTracking } from './FaceTracking'

function mean(v1: THREE.Vector3, v2: THREE.Vector3) {
  return v1.clone().add(v2).multiplyScalar(0.5)
}

function localToLocal(objSrc: THREE.Object3D, v: THREE.Vector3, objDst: THREE.Object3D) {
  // see: https://discourse.threejs.org/t/object3d-localtolocal/51564
  const v_world = objSrc.localToWorld(v)
  return objDst.worldToLocal(v_world)
}

//
//
//

export type FaceControlsProps = {
  /** The camera to be controlled */
  camera?: THREE.Camera
  /** VideoTexture or WebcamVideoTexture options */
  videoTexture?: VideoTextureProps
  /** Disable the automatic face-detection => you should provide `faceLandmarkerResult` yourself in this case */
  manualDetect?: boolean
  /** FaceLandmarker result */
  faceLandmarkerResult?: FaceLandmarkerResult
  /** Disable the rAF camera position/rotation update */
  manualUpdate?: boolean
  /** Reference this FaceControls instance as state's `controls` */
  makeDefault?: boolean
  /** Approximate time to reach the target. A smaller value will reach the target faster. */
  smoothTime?: number
  /** Apply position offset extracted from `facialTransformationMatrix` */
  offset?: boolean
  /** Offset sensitivity factor, less is more sensible */
  offsetScalar?: number
  /** Enable eye-tracking */
  eyes?: boolean
  /** Force Facemesh's `origin` to be the middle of the 2 eyes */
  eyesAsOrigin?: boolean
  /** Constant depth of the Facemesh */
  depth?: number
  /** Enable debug mode */
  debug?: boolean
  /** Facemesh options, default: undefined */
  facemesh?: FacemeshProps
}

export type FaceControlsApi = THREE.EventDispatcher & {
  /** Compute the target for the camera */
  computeTarget: () => THREE.Object3D
  /** Update camera's position/rotation to the `target` */
  update: (delta: number, target?: THREE.Object3D) => void
  /** <Facemesh> ref api */
  facemeshApiRef: RefObject<FacemeshApi>
}

const FaceControlsContext = /* @__PURE__ */ createContext({} as FaceControlsApi)

/**
 * The camera follows your face.
 *
 * Pre-requisite: wrap into a `FaceLandmarker` provider:
 *
 * ```jsx
 * <FaceLandmarker>...</FaceLandmarker>
 * ```
 */

export const FaceControls = /* @__PURE__ */ forwardRef<FaceControlsApi, FaceControlsProps>(
  ({ videoTexture, manualDetect, faceLandmarkerResult, ...props }, fref) => {
    const faceTracking = useFaceTracking()

    // A `FaceTracking` above: share its webcam and its detection
    if (faceTracking) {
      return <FaceControlsImpl ref={fref} {...props} faceTracking={faceTracking} />
    }

    // None: an implicit one, for this `FaceControls` alone
    return (
      <FaceTracking videoTexture={videoTexture} manualDetect={manualDetect} faceLandmarkerResult={faceLandmarkerResult}>
        <FaceControlsWithFaceTracking ref={fref} {...props} />
      </FaceTracking>
    )
  }
)

type FaceControlsImplProps = Omit<FaceControlsProps, 'videoTexture' | 'manualDetect' | 'faceLandmarkerResult'>

/** `FaceControls`, reading the `FaceTracking` its parent has just rendered */
const FaceControlsWithFaceTracking = /* @__PURE__ */ forwardRef<FaceControlsApi, FaceControlsImplProps>(
  (props, fref) => {
    const faceTracking = useFaceTracking()
    if (!faceTracking) return null // cannot happen: always rendered inside a `FaceTracking`

    return <FaceControlsImpl ref={fref} {...props} faceTracking={faceTracking} />
  }
)

const FaceControlsImpl = /* @__PURE__ */ forwardRef<
  FaceControlsApi,
  FaceControlsImplProps & { faceTracking: FaceTrackingApi }
>(
  (
    {
      faceTracking,
      camera,
      manualUpdate = false,
      makeDefault,
      smoothTime = 0.25,
      offset = true,
      offsetScalar = 80,
      eyes = false,
      eyesAsOrigin = true,
      depth = 0.15,
      debug = false,
      facemesh,
    },
    fref
  ) => {
    const scene = useThree((state) => state.scene)
    const defaultCamera = useThree((state) => state.camera)
    const set = useThree((state) => state.set)
    const get = useThree((state) => state.get)
    const explCamera = camera || defaultCamera

    const facemeshApiRef = useRef<FacemeshApi>(null)

    //
    // computeTarget()
    //
    // Compute `target` position and rotation for the camera (according to <Facemesh>)
    //
    //  1. 👀 either following the 2 eyes
    //  2. 👤 or just the head mesh
    //

    const [target] = useState(() => new THREE.Object3D())
    const [irisRightDirPos] = useState(() => new THREE.Vector3())
    const [irisLeftDirPos] = useState(() => new THREE.Vector3())
    const [irisRightLookAt] = useState(() => new THREE.Vector3())
    const [irisLeftLookAt] = useState(() => new THREE.Vector3())
    const computeTarget = useCallback<FaceControlsApi['computeTarget']>(() => {
      // same parent as the camera
      target.parent = explCamera.parent

      const facemeshApi = facemeshApiRef.current
      if (facemeshApi) {
        const { outerRef, eyeRightRef, eyeLeftRef } = facemeshApi

        if (eyeRightRef.current && eyeLeftRef.current) {
          // 1. 👀

          const { irisDirRef: irisRightDirRef } = eyeRightRef.current
          const { irisDirRef: irisLeftDirRef } = eyeLeftRef.current

          if (irisRightDirRef.current && irisLeftDirRef.current && outerRef.current) {
            //
            // position: mean of irisRightDirPos,irisLeftDirPos
            //
            irisRightDirPos.copy(localToLocal(irisRightDirRef.current, new THREE.Vector3(0, 0, 0), outerRef.current))
            irisLeftDirPos.copy(localToLocal(irisLeftDirRef.current, new THREE.Vector3(0, 0, 0), outerRef.current))
            target.position.copy(
              localToLocal(outerRef.current, mean(irisRightDirPos, irisLeftDirPos), explCamera.parent || scene)
            )

            //
            // lookAt: mean of irisRightLookAt,irisLeftLookAt
            //
            irisRightLookAt.copy(localToLocal(irisRightDirRef.current, new THREE.Vector3(0, 0, 1), outerRef.current))
            irisLeftLookAt.copy(localToLocal(irisLeftDirRef.current, new THREE.Vector3(0, 0, 1), outerRef.current))
            target.lookAt(outerRef.current.localToWorld(mean(irisRightLookAt, irisLeftLookAt)))
          }
        } else {
          // 2. 👤

          if (outerRef.current) {
            target.position.copy(localToLocal(outerRef.current, new THREE.Vector3(0, 0, 0), explCamera.parent || scene))
            target.lookAt(outerRef.current.localToWorld(new THREE.Vector3(0, 0, 1)))
          }
        }
      }

      return target
    }, [explCamera, irisLeftDirPos, irisLeftLookAt, irisRightDirPos, irisRightLookAt, scene, target])

    //
    // update()
    //
    // Updating the camera `current` position and rotation, following `target`
    //

    const [current] = useState(() => new THREE.Object3D())
    const update = useCallback<FaceControlsApi['update']>(
      function (delta, target) {
        if (explCamera) {
          target ??= computeTarget()

          if (smoothTime > 0) {
            // damping current
            const eps = 1e-9
            easing.damp3(current.position, target.position, smoothTime, delta, undefined, undefined, eps)
            easing.dampE(current.rotation, target.rotation, smoothTime, delta, undefined, undefined, eps)
          } else {
            // instant
            current.position.copy(target.position)
            current.rotation.copy(target.rotation)
          }

          explCamera.position.copy(current.position)
          explCamera.rotation.copy(current.rotation)
        }
      },
      [explCamera, computeTarget, smoothTime, current.position, current.rotation]
    )

    useFrame((_, delta) => {
      if (manualUpdate) return
      update(delta)
    })

    //
    // Ref API
    //

    const api = useMemo<FaceControlsApi>(
      () =>
        Object.assign(Object.create(THREE.EventDispatcher.prototype), {
          computeTarget,
          update,
          facemeshApiRef,
        }),
      [computeTarget, update]
    )
    useImperativeHandle(fref, () => api, [api])

    //
    // makeDefault (`controls` global state)
    //

    useEffect(() => {
      if (makeDefault) {
        const old = get().controls
        set({ controls: api })
        return () => set({ controls: old })
      }
    }, [makeDefault, api, get, set])

    //
    //
    //

    return (
      <FaceControlsContext.Provider value={api}>
        <FaceControlsFacemesh
          ref={facemeshApiRef}
          faceTracking={faceTracking}
          children={<meshNormalMaterial side={THREE.DoubleSide} />}
          {...facemesh}
          depth={depth}
          eyes={eyes}
          eyesAsOrigin={eyesAsOrigin}
          offset={offset}
          offsetScalar={offsetScalar}
          debug={debug}
          rotation-z={Math.PI}
          visible={debug}
        />
      </FaceControlsContext.Provider>
    )
  }
)

/**
 * The `Facemesh` of a `FaceControls`, fed with the first face of the latest detection result.
 *
 * `Facemesh` is driven by props, so each new result has to re-render it: this component subscribes to the
 * results so that it is the only one to re-render, not the whole `FaceControls`.
 */
const FaceControlsFacemesh = /* @__PURE__ */ forwardRef<FacemeshApi, FacemeshProps & { faceTracking: FaceTrackingApi }>(
  ({ faceTracking, ...props }, fref) => {
    const result = useSyncExternalStore(faceTracking.subscribe, faceTracking.getResult, faceTracking.getResult)

    const points = result?.faceLandmarks[0]
    const facialTransformationMatrix = result?.facialTransformationMatrixes?.[0]
    const faceBlendshapes = result?.faceBlendshapes?.[0]

    return (
      <Facemesh
        ref={fref}
        {...props}
        points={points}
        facialTransformationMatrix={facialTransformationMatrix}
        faceBlendshapes={faceBlendshapes}
      />
    )
  }
)

export const useFaceControls = () => useContext(FaceControlsContext)
