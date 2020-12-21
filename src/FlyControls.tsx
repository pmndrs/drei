import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { FlyControls as FlyControlsImpl } from 'three/examples/jsm/controls/FlyControls'
import useEffectfulState from './helpers/useEffectfulState'

export type FlyControls = Overwrite<
  ReactThreeFiber.Object3DNode<FlyControlsImpl, typeof FlyControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

export const FlyControls = React.forwardRef((props: FlyControls, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState<FlyControlsImpl>(
    () => new FlyControlsImpl(camera, gl.domElement),
    [camera, gl.domElement],
    ref as any
  )

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  useFrame((_, delta) => controls?.update(delta))

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})
