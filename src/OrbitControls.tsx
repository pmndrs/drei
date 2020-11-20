import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls'
import useEffectfulState from './helpers/useEffectfulState'

export type OrbitControls = Overwrite<
  ReactThreeFiber.Object3DNode<OrbitControlsImpl, typeof OrbitControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControlsImpl: OrbitControls
    }
  }
}

export const OrbitControls = React.forwardRef((props: OrbitControls = { enableDamping: true }, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState<OrbitControlsImpl>(
    () => new OrbitControlsImpl(camera, gl.domElement),
    [camera, gl],
    ref as any
  )

  useFrame(() => controls?.update())

  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive dispose={undefined} object={controls} enableDamping {...props} /> : null
})
