import { ReactThreeFiber, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { FlyControls as FlyControlsImpl } from 'three-stdlib'

export type FlyControlsProps = ReactThreeFiber.Object3DNode<FlyControlsImpl, typeof FlyControlsImpl> & {
  onChange?: (e?: THREE.Event) => void
}

export const FlyControls = React.forwardRef<FlyControlsImpl, FlyControlsProps>((props, ref) => {
  const { onChange, ...rest } = props
  const invalidate = useThree(({ invalidate }) => invalidate)
  const camera = useThree(({ camera }) => camera)
  const gl = useThree(({ gl }) => gl)
  const [controls] = React.useState(() => new FlyControlsImpl(camera, gl.domElement))

  React.useEffect(() => {
    const callback = (e: THREE.Event) => {
      invalidate()
      if (onChange) onChange(e)
    }

    controls?.addEventListener?.('change', callback)
    return () => controls?.removeEventListener?.('change', callback)
  }, [onChange, controls, invalidate])

  useFrame((_, delta) => controls?.update(delta))

  return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...rest} /> : null
})
