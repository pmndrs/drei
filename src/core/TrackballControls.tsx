import { ReactThreeFiber, ThreeElement, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'
import { ForwardRefComponent, Overwrite } from '../helpers/ts-utils'

export type TrackballControlsProps = Omit<
  Overwrite<
    ThreeElement<typeof TrackballControlsImpl>,
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
  >,
  'ref' | 'args'
>

export const TrackballControls: ForwardRefComponent<TrackballControlsProps, TrackballControlsImpl> =
  /* @__PURE__ */ React.forwardRef<TrackballControlsImpl, TrackballControlsProps>(
    ({ makeDefault, camera, domElement, regress, onChange, onStart, onEnd, ...restProps }, ref) => {
      const { invalidate, camera: defaultCamera, gl, events, set, get, performance, viewport } = useThree()
      const explCamera = camera || defaultCamera
      const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
      const controls = React.useMemo(
        () => new TrackballControlsImpl(explCamera as THREE.PerspectiveCamera),
        [explCamera]
      )

      useFrame(() => {
        if (controls.enabled) controls.update()
      }, -1)

      React.useEffect(() => {
        controls.connect(explDomElement)
        return () => void controls.dispose()
      }, [explDomElement, regress, controls, invalidate])

      React.useEffect(() => {
        // TrackballControls applies pointer deltas only inside update(), which
        // runs in useFrame — under frameloop="demand" no frame is scheduled, so
        // the change → invalidate chain can never start itself (change is only
        // dispatched from update()). Kick the loop while the user interacts;
        // damping then self-sustains through the change listener above.
        let active = false
        const onStart = () => {
          active = true
          invalidate()
        }
        const onEnd = () => (active = false)
        const onMove = () => active && invalidate()
        controls.addEventListener('start', onStart)
        controls.addEventListener('end', onEnd)
        explDomElement.addEventListener('pointermove', onMove, { passive: true })
        return () => {
          controls.removeEventListener('start', onStart)
          controls.removeEventListener('end', onEnd)
          explDomElement.removeEventListener('pointermove', onMove)
        }
      }, [explDomElement, controls, invalidate])

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
          // @ts-ignore https://github.com/three-types/three-ts-types/pull/1398
          set({ controls })
          return () => set({ controls: old })
        }
      }, [makeDefault, controls])

      return <primitive ref={ref} object={controls} {...restProps} />
    }
  )
