import * as React from 'react'
import { ReactThreeFiber, useThree, useFrame } from '@react-three/fiber'
import { DragControls as DragControlsImpl } from 'three-stdlib'
import { Group, Object3D } from 'three'

export type DragControls = ReactThreeFiber.Overwrite<
  ReactThreeFiber.Object3DNode<DragControlsImpl, typeof DragControlsImpl>,
  {
    camera?: THREE.Camera
    objects: Object3D[]
  }
>

export const DragControls = React.forwardRef<DragControlsImpl, DragControls>(
  ({ objects, camera, children, ...restProps }, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const defaultCamera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)

    const explCamera = camera || defaultCamera
    const [controls] = React.useState<DragControlsImpl>(() => new DragControlsImpl(objects, explCamera, gl.domElement))

    React.useEffect(() => {
      controls?.addEventListener?.('change', invalidate)
      return () => controls?.removeEventListener?.('change', invalidate)
    }, [controls, invalidate])

    return <primitive ref={ref} dispose={undefined} object={controls} {...restProps} />
  }
)
