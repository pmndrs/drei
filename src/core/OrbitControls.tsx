import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    regress?: boolean
    enableDamping?: boolean
  }
>

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ camera, regress, enableDamping = true, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    const performance = useThree(({ performance }) => performance)
    const explCamera = camera || defaultCamera
    const controls = React.useMemo(() => new OrbitControlsImpl(explCamera), [explCamera])

    useFrame(() => controls.update())

    React.useEffect(() => {
      const callback = () => {
        invalidate()
        if (regress) performance.regress()
      }

      controls.connect(gl.domElement)
      controls.addEventListener('change', callback)
      return () => {
        controls.removeEventListener('change', callback)
        controls.dispose()
      }
    }, [regress, controls, invalidate])

    return <primitive ref={ref} object={controls} enableDamping={enableDamping} {...restProps} />
  }
)
