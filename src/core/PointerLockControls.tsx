import * as React from 'react'
import { ReactThreeFiber, useThree } from 'react-three-fiber'
import { PointerLockControls as PointerLockControlsImpl } from 'three/examples/jsm/controls/PointerLockControls'
import useEffectfulState from '../helpers/useEffectfulState'

export type PointerLockControls = ReactThreeFiber.Object3DNode<PointerLockControlsImpl, typeof PointerLockControlsImpl>

export type PointerLockControlsProps = PointerLockControls & { selector?: string; camera?: THREE.Camera }

export const PointerLockControls = React.forwardRef(({ selector, ...props }: PointerLockControlsProps, ref) => {
  const { camera, ...rest } = props
  const { camera: defaultCamera, gl, invalidate } = useThree()
  const explCamera = camera || defaultCamera

  const controls = useEffectfulState(
    () => {
      if (explCamera) {
        return new PointerLockControlsImpl(explCamera, gl.domElement)
      }
    },
    [explCamera, gl.domElement],
    ref as any
  )

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

  return controls ? <primitive dispose={undefined} object={controls} {...rest} /> : null
})
