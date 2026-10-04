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
        const callback = (e: THREE.Event) => {
          invalidate()
          if (regress) performance.regress()
          if (onChange) onChange(e)
        }

        const onInput = () => invalidate()
        const startCallback = (e: THREE.Event) => {
          invalidate()
          explDomElement.ownerDocument.addEventListener('pointermove', onInput, { passive: true })
          explDomElement.addEventListener('touchmove', onInput, { passive: true })
          if (onStart) onStart(e)
        }
        const endCallback = (e: THREE.Event) => {
          explDomElement.ownerDocument.removeEventListener('pointermove', onInput)
          explDomElement.removeEventListener('touchmove', onInput)
          if (onEnd) onEnd(e)
        }
        controls.addEventListener('change', callback)
        controls.addEventListener('start', startCallback)
        controls.addEventListener('end', endCallback)
        return () => {
          controls.removeEventListener('start', startCallback)
          controls.removeEventListener('end', endCallback)
          controls.removeEventListener('change', callback)
          explDomElement.ownerDocument.removeEventListener('pointermove', onInput)
          explDomElement.removeEventListener('touchmove', onInput)
        }
      }, [onChange, onStart, onEnd, controls, invalidate, explDomElement])

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
