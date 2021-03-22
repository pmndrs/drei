import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControlsProps = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
    regress?: boolean
  }
>

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControlsProps>(
  ({ camera, regress, enableDampening = true, ...restProps }, ref) => {
    const { camera: defaultCamera, gl, invalidate, performance } = useThree(
      ({ camera, gl, invalidate, performance }) => ({
        camera,
        gl,
        invalidate,
        performance,
      })
    )

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
    }, [controls, invalidate])

    return <primitive ref={ref} object={controls} enableDampening={enableDampening} {...restProps} />
  }
)
