/* eslint react-hooks/exhaustive-deps: 1 */
import {
  Box3,
  EventDispatcher,
  MathUtils,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three'

import * as React from 'react'
import { forwardRef, useMemo, useEffect } from 'react'
import { extend, useFrame, useThree, ReactThreeFiber, EventManager, ThreeElement } from '@react-three/fiber'

import CameraControlsImpl from 'camera-controls'
import { ForwardRefComponent, Overwrite } from '../helpers/ts-utils'

export type CameraControlsProps = Omit<
  Overwrite<
    ThreeElement<typeof CameraControlsImpl>,
    {
      camera?: PerspectiveCamera | OrthographicCamera
      domElement?: HTMLElement
      makeDefault?: boolean

      onControlstart?: (e?: { type: 'controlstart' }) => void
      onControl?: (e?: { type: 'control' }) => void
      onControlend?: (e?: { type: 'controlend' }) => void
      onTransitionstart?: (e?: { type: 'transitionstart' }) => void
      onUpdate?: (e?: { type: 'update' }) => void
      onWake?: (e?: { type: 'wake' }) => void
      onRest?: (e?: { type: 'rest' }) => void
      onSleep?: (e?: { type: 'sleep' }) => void

      /** @deprecated for OrbitControls compatibility: use `onControlstart` instead */
      onStart?: (e?: { type: 'controlstart' }) => void
      /** @deprecated for OrbitControls compatibility: use `onControlend` instead */
      onEnd?: (e?: { type: 'controlend' }) => void
      /** @deprecated for OrbitControls compatibility */
      onChange?: (e?: { type: string }) => void

      events?: boolean // Wether to enable events during controls interaction
      regress?: boolean
    }
  >,
  'ref' | 'args' | keyof EventDispatcher
>

export const CameraControls: ForwardRefComponent<CameraControlsProps, CameraControlsImpl> = /* @__PURE__ */ forwardRef<
  CameraControlsImpl,
  CameraControlsProps
>((props, ref) => {
  // useMemo is used here instead of useEffect, otherwise the useMemo below runs first and throws
  useMemo(() => {
    // to allow for tree shaking, we only import the subset of THREE that is used by camera-controls
    // see https://github.com/yomotsu/camera-controls#important
    const subsetOfTHREE = {
      Box3,
      MathUtils: {
        clamp: MathUtils.clamp,
      },
      Matrix4,
      Quaternion,
      Raycaster,
      Sphere,
      Spherical,
      Vector2,
      Vector3,
      Vector4,
    }

    CameraControlsImpl.install({ THREE: subsetOfTHREE })
    extend({ CameraControlsImpl })
  }, [])

  const {
    camera,
    domElement,
    makeDefault,
    onControlstart,
    onControl,
    onControlend,
    onTransitionstart,
    onUpdate,
    onWake,
    onRest,
    onSleep,
    onStart,
    onEnd,
    onChange,
    regress,
    ...restProps
  } = props

  const defaultCamera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const events = useThree((state) => state.events) as EventManager<HTMLElement>
  const setEvents = useThree((state) => state.setEvents)
  const set = useThree((state) => state.set)
  const get = useThree((state) => state.get)
  const performance = useThree((state) => state.performance)

  const explCamera = camera || defaultCamera
  const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement

  const controls = useMemo(() => new CameraControlsImpl(explCamera), [explCamera])

  useFrame((state, delta) => {
    if (controls.enabled) controls.update(delta)
  }, -1)

  useEffect(() => {
    controls.connect(explDomElement)
    return () => void controls.disconnect()
  }, [explDomElement, controls])

  useEffect(() => {
    function invalidateAndRegress() {
      invalidate()
      if (regress) performance.regress()
    }

    const handleControlstart = (e: { type: 'controlstart' }) => {
      invalidateAndRegress()
      onControlstart?.(e)
      onStart?.(e) // backwards compatibility
    }

    const handleControl = (e: { type: 'control' }) => {
      invalidateAndRegress()
      onControl?.(e)
      onChange?.(e) // backwards compatibility
    }

    const handleControlend = (e: { type: 'controlend' }) => {
      onControlend?.(e)
      onEnd?.(e) // backwards compatibility
    }

    const handleTransitionstart = (e: { type: 'transitionstart' }) => {
      invalidateAndRegress()
      onTransitionstart?.(e)
      onChange?.(e) // backwards compatibility
    }

    const handleUpdate = (e: { type: 'update' }) => {
      invalidateAndRegress()
      onUpdate?.(e)
      onChange?.(e) // backwards compatibility
    }

    const handleWake = (e: { type: 'wake' }) => {
      invalidateAndRegress()
      onWake?.(e)
      onChange?.(e) // backwards compatibility
    }

    const handleRest = (e: { type: 'rest' }) => {
      onRest?.(e)
    }

    const handleSleep = (e: { type: 'sleep' }) => {
      onSleep?.(e)
    }

    controls.addEventListener('controlstart', handleControlstart)
    controls.addEventListener('control', handleControl)
    controls.addEventListener('controlend', handleControlend)
    controls.addEventListener('transitionstart', handleTransitionstart)
    controls.addEventListener('update', handleUpdate)
    controls.addEventListener('wake', handleWake)
    controls.addEventListener('rest', handleRest)
    controls.addEventListener('sleep', handleSleep)

    return () => {
      controls.removeEventListener('controlstart', handleControlstart)
      controls.removeEventListener('control', handleControl)
      controls.removeEventListener('controlend', handleControlend)
      controls.removeEventListener('transitionstart', handleTransitionstart)
      controls.removeEventListener('update', handleUpdate)
      controls.removeEventListener('wake', handleWake)
      controls.removeEventListener('rest', handleRest)
      controls.removeEventListener('sleep', handleSleep)
    }
  }, [
    controls,

    invalidate,
    setEvents,
    regress,

    performance,

    onControlstart,
    onControl,
    onControlend,
    onTransitionstart,
    onUpdate,
    onWake,
    onRest,
    onSleep,

    onChange,
    onStart,
    onEnd,
  ])

  useEffect(() => {
    if (makeDefault) {
      const old = get().controls
      set({ controls: controls as unknown as EventDispatcher })
      return () => set({ controls: old })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeDefault, controls])

  return <primitive ref={ref} object={controls} {...restProps} />
})

export type CameraControls = CameraControlsImpl

// class reference (useful to access static-props like ACTION)
export { CameraControlsImpl }
