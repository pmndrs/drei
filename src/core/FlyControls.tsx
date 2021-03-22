import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { FlyControls as FlyControlsImpl } from 'three-stdlib'

export type FlyControls = ReactThreeFiber.Object3DNode<FlyControlsImpl, typeof FlyControlsImpl>

export const FlyControls = React.forwardRef<FlyControlsImpl, FlyControls>((props, ref) => {
  const { camera, gl, invalidate } = useThree(({ camera, gl, invalidate }) => ({ camera, gl, invalidate }))
  const [controls] = React.useState(() => new FlyControlsImpl(camera, gl.domElement))

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  useFrame((_, delta) => controls?.update(delta))

  return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...props} /> : null
})
