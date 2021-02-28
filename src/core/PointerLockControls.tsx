import * as React from 'react'
import { ReactThreeFiber, useThree } from 'react-three-fiber'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import useEffectfulState from '../helpers/useEffectfulState'

export type PointerLockControls = ReactThreeFiber.Object3DNode<PointerLockControlsImpl, typeof PointerLockControlsImpl>

export type PointerLockControlsProps = PointerLockControls & { selector?: string }

export const PointerLockControls = React.forwardRef(({ selector, ...props }: PointerLockControlsProps, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState(
    () => new PointerLockControlsImpl(camera, gl.domElement),
    [camera, gl.domElement],
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

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})
