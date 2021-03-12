import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { MapControls as MapControlsImpl } from 'three-stdlib'
import useEffectfulState from '../helpers/useEffectfulState'

export type MapControls = Overwrite<
  ReactThreeFiber.Object3DNode<MapControlsImpl, typeof MapControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mapControlsImpl: MapControls
    }
  }
}

export const MapControls = React.forwardRef((props: MapControls = { enableDamping: true }, ref) => {
  const { camera, gl, invalidate } = useThree(({ camera, gl, invalidate }) => ({ camera, gl, invalidate }))
  const controls = useEffectfulState(() => new MapControlsImpl(camera, gl.domElement), [camera, gl], ref as any)

  useFrame(() => controls?.update())
  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive dispose={undefined} object={controls} enableDamping {...props} /> : null
})
