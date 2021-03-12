import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame, Overwrite } from 'react-three-fiber'
import { MapControls as MapControlsImpl } from 'three-stdlib'
import useEffectfulState from '../helpers/useEffectfulState'

export type MapControls = Overwrite<
  ReactThreeFiber.Object3DNode<MapControlsImpl, typeof MapControlsImpl>,
  { target?: ReactThreeFiber.Vector3; camera?: THREE.Camera }
>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mapControlsImpl: MapControls
    }
  }
}

export const MapControls = React.forwardRef((props: MapControls = { enableDamping: true }, ref) => {
  const { camera, ...rest } = props
  const { camera: defaultCamera, gl, invalidate } = useThree()
  const explCamera = camera || defaultCamera
  const controls = useEffectfulState(
    () => {
      if (explCamera) {
        return new MapControlsImpl(explCamera, gl.domElement)
      }
    },
    [explCamera, gl],
    ref as any
  )

  useFrame(() => controls?.update())
  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive dispose={undefined} object={controls} enableDamping {...rest} /> : null
})
