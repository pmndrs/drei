import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
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
  }
>

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ makeDefault, camera, regress, domElement, enableDamping = true, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const set = useThree(({ set }) => set)
    const get = useThree(({ get }) => get)
    const performance = useThree(({ performance }) => performance)
    const explCamera = camera || defaultCamera
    const explDomElement = domElement || gl.domElement
    const controls = React.useMemo(() => new OrbitControlsImpl(explCamera), [explCamera])

    useFrame(() => {
      if (controls.enabled) controls.update()
    })

    React.useEffect(() => {
      const callback = () => {
        invalidate()
        if (regress) performance.regress()
      }

      controls.connect(explDomElement)
      controls.addEventListener('change', callback)
      return () => {
        controls.removeEventListener('change', callback)
        controls.dispose()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regress, controls, invalidate])

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
