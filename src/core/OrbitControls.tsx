import { EventManager, ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import type { Camera, Event } from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControlsProps = Omit<
  ReactThreeFiber.Overwrite<
    ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
    {
      camera?: Camera
      domElement?: HTMLElement
      enableDamping?: boolean
      makeDefault?: boolean
      onChange?: (e?: Event) => void
      onEnd?: (e?: Event) => void
      onStart?: (e?: Event) => void
      regress?: boolean
      target?: ReactThreeFiber.Vector3
    }
  >,
  'ref'
>

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ makeDefault, camera, regress, domElement, enableDamping = true, onChange, onStart, onEnd, ...restProps }, ref) => {
    const invalidate = useThree((state) => state.invalidate)
    const defaultCamera = useThree((state) => state.camera)
    const gl = useThree((state) => state.gl)
    const events = useThree((state) => state.events) as EventManager<HTMLElement>
    const set = useThree((state) => state.set)
    const get = useThree((state) => state.get)
    const performance = useThree((state) => state.performance)
    const explCamera = camera || defaultCamera
    const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
    const controls = React.useMemo(() => new OrbitControlsImpl(explCamera), [explCamera])

    useFrame(() => {
      if (controls.enabled) controls.update()
    }, -1)

    React.useEffect(() => {
      controls.connect(explDomElement)
      return () => void controls.dispose()
    }, [explDomElement, regress, controls, invalidate])

    React.useEffect(() => {
      const callback = (e: Event) => {
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
      if (makeDefault) {
        const old = get().controls
        set({ controls })
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return <primitive ref={ref} object={controls} enableDamping={enableDamping} {...restProps} />
  }
)
