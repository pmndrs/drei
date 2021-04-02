import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
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
  const { invalidate, domElement, defaultCamera } = useThree(({ invalidate, camera, gl }) => ({
    invalidate,
    defaultCamera: camera,
    domElement: gl.domElement,
  }))

  const explCamera = camera || defaultCamera
  const [controls] = React.useState(() => new MapControlsImpl(explCamera))

  React.useEffect(() => {
    controls.connect(domElement)
    controls.addEventListener('change', invalidate)

    return () => {
      controls.dispose()
      controls.removeEventListener('change', invalidate)
    }
  }, [controls, invalidate, domElement])

  useFrame(() => controls.update())

  return <primitive ref={ref} dispose={undefined} object={controls} enableDamping {...rest} />
})
