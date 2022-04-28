import { ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'

export type TrackballControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<TrackballControlsImpl, typeof TrackballControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    domElement?: HTMLElement
    regress?: boolean
    makeDefault?: boolean
    onChange?: (e?: THREE.Event) => void
    onStart?: (e?: THREE.Event) => void
    onEnd?: (e?: THREE.Event) => void
  }
>

export const TrackballControls = React.forwardRef<TrackballControlsImpl, TrackballControlsProps>(
  ({ makeDefault, camera, domElement, regress, onChange, onStart, onEnd, ...restProps }, ref) => {
    const { invalidate, camera: defaultCamera, gl, events, set, get, performance, viewport } = useThree()
    const explCamera = camera || defaultCamera
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const controls = React.useMemo(() => new TrackballControlsImpl(explCamera as THREE.PerspectiveCamera), [explCamera])

    useFrame(() => {
      if (controls.enabled) controls.update()
    }, -1)

    React.useEffect(() => {
      controls.connect(explDomElement)
      return () => void controls.dispose()
    }, [explDomElement, regress, controls, invalidate])

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (regress) performance.regress()
        if (onChange) onChange(e)
      }
      controls.addEventListener('change', callback)
      if (onStart) controls.addEventListener('start', onStart)
      if (onEnd) controls.addEventListener('end', onEnd)
      return () => {
        if (onStart) controls.removeEventListener('start', onStart)
        if (onEnd) controls.removeEventListener('end', onEnd)
        controls.removeEventListener('change', callback)
      }
    }, [onChange, onStart, onEnd, controls, invalidate])

    React.useEffect(() => {
      controls.handleResize()
    }, [viewport])

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls
        set({ controls })
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return <primitive ref={ref} object={controls} {...restProps} />
  }
)
