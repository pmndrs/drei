import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from 'react-three-fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type OrbitControls = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  {
    target?: ReactThreeFiber.Vector3
    camera?: THREE.Camera
  }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControlsImpl: OrbitControls
    }
  }
}

export const OrbitControls = React.forwardRef<OrbitControlsImpl, OrbitControls>(
  (props = { enableDamping: true }, ref) => {
    const { camera, ...rest } = props
    const { camera: defaultCamera, gl, invalidate } = useThree(({ camera, gl, invalidate }) => ({
      camera,
      gl,
      invalidate,
    }))
    const explCamera = camera || defaultCamera

    const [controls] = React.useState(() => new OrbitControlsImpl(explCamera, gl.domElement))

    useFrame(() => controls?.update())

    React.useEffect(() => {
      controls?.addEventListener?.('change', invalidate)
      return () => controls?.removeEventListener?.('change', invalidate)
    }, [controls, invalidate])

    return controls ? <primitive ref={ref} dispose={undefined} object={controls} enableDamping {...rest} /> : null
  }
)
