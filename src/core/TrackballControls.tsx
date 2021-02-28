import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'
import useEffectfulState from '../helpers/useEffectfulState'

export type TrackballControls = Overwrite<
  ReactThreeFiber.Object3DNode<TrackballControlsImpl, typeof TrackballControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      trackballControlsImpl: TrackballControls
    }
  }
}

export const TrackballControls = React.forwardRef((props: TrackballControls, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState(() => new TrackballControlsImpl(camera, gl.domElement), [camera, gl], ref as any)

  useFrame(() => controls?.update())
  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})
