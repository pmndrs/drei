import * as React from 'react'
import { ReactThreeFiber, useThree } from '@react-three/fiber'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

export type PointerLockControls = ReactThreeFiber.Object3DNode<PointerLockControlsImpl, typeof PointerLockControlsImpl>

export type PointerLockControlsProps = PointerLockControls & { selector?: string; camera?: THREE.Camera }

export const PointerLockControls = React.forwardRef<PointerLockControls, PointerLockControlsProps>(
  ({ selector, ...props }, ref) => {
    const { camera, ...rest } = props
    const gl = useThree(({ gl }) => gl)
    const defaultCamera = useThree(({ camera }) => camera)
    const invalidate = useThree(({ invalidate }) => invalidate)
    const explCamera = camera || defaultCamera

    const [controls] = React.useState(() => new PointerLockControlsImpl(explCamera, gl.domElement))

    React.useEffect(() => {
      controls?.addEventListener?.('change', invalidate)
      return () => controls?.removeEventListener?.('change', invalidate)
    }, [controls, invalidate])

    React.useEffect(() => {
      const handler = () => controls?.lock()
      const element = selector ? document.querySelector(selector) : document
      element && element.addEventListener('click', handler)
      return () => (element ? element.removeEventListener('click', handler) : undefined)
    }, [controls, selector])

    return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...rest} /> : null
  }
)
