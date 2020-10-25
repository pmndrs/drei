import React, { forwardRef, useEffect } from 'react'
import { ReactThreeFiber, useThree, Overwrite } from 'react-three-fiber'
import { PointerLockControls as PointerLockControlsImpl } from 'three/examples/jsm/controls/PointerLockControls'
import useEffectfulState from './helpers/useEffectfulState'

export type PointerLockControls = Overwrite<
  ReactThreeFiber.Object3DNode<PointerLockControlsImpl, typeof PointerLockControlsImpl>,
  { target?: ReactThreeFiber.Vector3 }
>

export const PointerLockControls = forwardRef((props: PointerLockControls, ref) => {
  const { camera, gl, invalidate } = useThree()
  const controls = useEffectfulState(
    () => new PointerLockControlsImpl(camera, gl.domElement),
    [camera, gl.domElement],
    ref as any
  )

  useEffect(() => {
    controls?.addEventListener?.('change', invalidate)
    return () => controls?.removeEventListener?.('change', invalidate)
  }, [controls, invalidate])

  useEffect(() => {
    const handler = () => controls?.lock()
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [controls])

  return controls ? <primitive dispose={undefined} object={controls} {...props} /> : null
})
