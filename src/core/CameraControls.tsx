import * as THREE from 'three'
import type { PerspectiveCamera, OrthographicCamera } from 'three'

import * as React from 'react'
import { forwardRef, useMemo, useEffect } from 'react'
import { extend, useFrame, useThree, ReactThreeFiber, EventManager } from '@react-three/fiber'

import CameraControlsImpl from 'camera-controls'

export type CameraControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Node<CameraControlsImpl, typeof CameraControlsImpl>,
    {
      camera?: PerspectiveCamera | OrthographicCamera
      domElement?: HTMLElement
      onStart?: (e?: { type: 'controlstart' }) => void
      onEnd?: (e?: { type: 'controlend' }) => void
      onChange?: (e?: { type: 'control' }) => void
      events?: boolean
      regress?: boolean
    }
  >,
  'ref'
>

export const CameraControls = forwardRef<CameraControlsImpl, CameraControlsProps>((props, ref) => {
  useMemo(() => {
    CameraControlsImpl.install({ THREE })
    extend({ CameraControlsImpl })
  }, [])

  const { camera, domElement, onStart, onEnd, onChange, events: enableEvents, regress, ...restProps } = props

  const defaultCamera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const events = useThree((state) => state.events) as EventManager<HTMLElement>
  const setEvents = useThree((state) => state.setEvents)
  const performance = useThree((state) => state.performance)

  const explCamera = camera || defaultCamera
  const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement

  const cameraControls = useMemo(() => new CameraControlsImpl(explCamera), [explCamera])

  useFrame((state, delta) => {
    if (cameraControls.enabled) cameraControls.update(delta)
  }, -1)

  useEffect(() => {
    cameraControls.connect(explDomElement)
    return () => void cameraControls.disconnect()
  }, [explDomElement, cameraControls])

  React.useEffect(() => {
    if (enableEvents) {
      setEvents({ enabled: true })
    }

    const callback = (e) => {
      invalidate()
      if (regress) performance.regress()
      if (onChange) onChange(e)
    }

    const onStartCb: CameraControlsProps['onStart'] = (e) => {
      if (onStart) onStart(e)
      if (!enableEvents) setEvents({ enabled: false })
    }

    const onEndCb: CameraControlsProps['onEnd'] = (e) => {
      if (onEnd) onEnd(e)
      if (!enableEvents) setEvents({ enabled: true })
    }

    cameraControls.addEventListener('control', callback)
    cameraControls.addEventListener('controlstart', onStartCb)
    cameraControls.addEventListener('controlend', onEndCb)

    return () => {
      cameraControls.removeEventListener('control', callback)
      cameraControls.removeEventListener('controlstart', onStartCb)
      cameraControls.removeEventListener('controlend', onEndCb)
    }
  }, [cameraControls, enableEvents, onStart, onEnd, invalidate, setEvents, regress, onChange])

  return <primitive ref={ref} object={cameraControls} {...restProps} />
})

export type CameraControls = CameraControlsImpl
