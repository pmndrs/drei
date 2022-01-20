import { EventManager, ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    domElement?: HTMLElement
    regress?: boolean
    enableDamping?: boolean
    makeDefault?: boolean
    reverseOrbit?:boolean
    onChange?: (e?: THREE.Event) => void
    onStart?: (e?: THREE.Event) => void
    onEnd?: (e?: THREE.Event) => void
  }
>

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ makeDefault, camera, regress, domElement, enableDamping = true, reverseOrbit=false, onChange, onStart, onEnd, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const events = useThree(({ events }) => events) as EventManager<HTMLElement>
    const set = useThree(({ set }) => set)
    const get = useThree(({ get }) => get)
    const performance = useThree(({ performance }) => performance)
    const explCamera = camera || defaultCamera
    const explDomElement = domElement || (typeof events.connected !== 'boolean' ? events.connected : gl.domElement)
    const controls = React.useMemo(() => new OrbitControlsImpl(explCamera), [explCamera])

    useFrame(() => {
      if (controls.enabled) controls.update()
    })

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (regress) performance.regress()
        if (onChange) onChange(e)
      }

      controls.connect(explDomElement)
      controls.addEventListener('change', callback)

      if (onStart) controls.addEventListener('start', onStart)
      if (onEnd) controls.addEventListener('end', onEnd)

      return () => {
        controls.removeEventListener('change', callback)
        if (onStart) controls.removeEventListener('start', onStart)
        if (onEnd) controls.removeEventListener('end', onEnd)
        controls.dispose()
      }
    }, [explDomElement, onChange, onStart, onEnd, regress, controls, invalidate])

    React.useEffect(() => {
      if (makeDefault) {
        // @ts-expect-error new in @react-three/fiber@7.0.5
        const old = get().controls
        // @ts-expect-error new in @react-three/fiber@7.0.5
        set({ controls })
        // @ts-expect-error new in @react-three/fiber@7.0.5
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return <primitive ref={ref} object={controls} enableDamping={enableDamping} {...restProps} />
  }
)
