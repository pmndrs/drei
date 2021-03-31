import * as React from 'react'
import { PerspectiveCamera } from 'three'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { TrackballControls as TrackballControlsImpl } from 'three-stdlib'

export type TrackballControls = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<TrackballControlsImpl, typeof TrackballControlsImpl>,
  { target?: ReactThreeFiber.Vector3; camera?: THREE.Camera }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      trackballControlsImpl: TrackballControls
    }
  }
}

export const TrackballControls = React.forwardRef<TrackballControlsImpl, TrackballControls>((props, ref) => {
  const { camera, ...rest } = props
  const gl = useThree(({ gl }) => gl)
  const defaultCamera = useThree(({ camera }) => camera)
  const invalidate = useThree(({ invalidate }) => invalidate)

  const explCamera = camera || defaultCamera

  const [controls] = React.useState(() => new TrackballControlsImpl(explCamera as PerspectiveCamera, gl.domElement))

  useFrame(() => controls?.update())
  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...rest} /> : null
})
