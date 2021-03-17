import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from 'react-three-fiber'
import { MapControls as MapControlsImpl } from 'three-stdlib'

export type MapControls = ReactThreeFiber.Overwrite<
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

export const MapControls = React.forwardRef<MapControlsImpl, MapControls>((props = { enableDamping: true }, ref) => {
  const { camera, ...rest } = props
  const { camera: defaultCamera, gl, invalidate } = useThree(({ camera, gl, invalidate }) => ({
    camera,
    gl,
    invalidate,
  }))
  const explCamera = camera || defaultCamera
  const [controls] = React.useState(() => new MapControlsImpl(explCamera, gl.domElement))

  useFrame(() => controls?.update())
  React.useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  return controls ? <primitive ref={ref} dispose={undefined} object={controls} enableDamping {...rest} /> : null
})
