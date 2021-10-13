import { ReactThreeFiber, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

export type PointerLockControlsProps = ReactThreeFiber.Object3DNode<
  PointerLockControlsImpl,
  typeof PointerLockControlsImpl
> & {
  selector?: string
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  onLock?: (e?: THREE.Event) => void
  onUnlock?: (e?: THREE.Event) => void
}

export const PointerLockControls = React.forwardRef<PointerLockControlsImpl, PointerLockControlsProps>(
  ({ selector, onChange, onLock, onUnlock, ...props }, ref) => {
    const { camera, ...rest } = props
    const gl = useThree(({ gl }) => gl)
    const defaultCamera = useThree(({ camera }) => camera)
    const invalidate = useThree(({ invalidate }) => invalidate)
    const explCamera = camera || defaultCamera

    const [controls] = React.useState(() => new PointerLockControlsImpl(explCamera, gl.domElement))

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }

      controls?.addEventListener?.('change', callback)

      if (onLock) controls?.addEventListener?.('lock', onLock)
      if (onUnlock) controls?.addEventListener?.('unlock', onUnlock)

      return () => {
        controls?.removeEventListener?.('change', callback)
        if (onLock) controls?.addEventListener?.('lock', onLock)
        if (onUnlock) controls?.addEventListener?.('unlock', onUnlock)
      }
    }, [onChange, onLock, onUnlock, controls, invalidate])

    React.useEffect(() => {
      const handler = () => controls?.lock()
      const elements = selector ? Array.from(document.querySelectorAll(selector)) : [document]
      elements.forEach((element) => element && element.addEventListener('click', handler))
      return () => {
        elements.forEach((element) => (element ? element.removeEventListener('click', handler) : undefined))
      }
    }, [controls, selector])

    return controls ? <primitive ref={ref} dispose={undefined} object={controls} {...rest} /> : null
  }
)
