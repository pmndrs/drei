import { EventManager, ReactThreeFiber, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

export type PointerLockControlsProps = ReactThreeFiber.Object3DNode<
  PointerLockControlsImpl,
  typeof PointerLockControlsImpl
> & {
  selector?: string
  enabled?: boolean
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  onLock?: (e?: THREE.Event) => void
  onUnlock?: (e?: THREE.Event) => void
}

export const PointerLockControls = React.forwardRef<PointerLockControlsImpl, PointerLockControlsProps>(
  ({ selector, onChange, onLock, onUnlock, enabled = true, ...props }, ref) => {
    const { camera, ...rest } = props
    const gl = useThree(({ gl }) => gl)
    const defaultCamera = useThree((state) => state.camera)
    const invalidate = useThree((state) => state.invalidate)
    const raycaster = useThree((state) => state.raycaster)
    const events = useThree((state) => state.events) as EventManager<HTMLElement>
    const explCamera = camera || defaultCamera
    const explDomElement = gl.domElement || (typeof events.connected !== 'boolean' ? events.connected : gl.domElement)

    const [controls] = React.useState(() => new PointerLockControlsImpl(explCamera))

    React.useEffect(() => {
      if (enabled) {
        controls.connect(explDomElement)
        // Force events to be centered while PLC is active
        const oldComputeOffsets = raycaster.computeOffsets
        raycaster.computeOffsets = (e) => ({ offsetX: e.target.width / 2, offsetY: e.target.height / 2 })
        return () => {
          controls.disconnect()
          raycaster.computeOffsets = oldComputeOffsets
        }
      }
    }, [enabled, controls])

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }

      controls.addEventListener('change', callback)

      if (onLock) controls.addEventListener('lock', onLock)
      if (onUnlock) controls.addEventListener('unlock', onUnlock)

      // Enforce previous interaction
      const handler = () => controls.lock()
      const elements = selector ? Array.from(document.querySelectorAll(selector)) : [document]
      elements.forEach((element) => element && element.addEventListener('click', handler))

      return () => {
        controls.removeEventListener('change', callback)
        if (onLock) controls.addEventListener('lock', onLock)
        if (onUnlock) controls.addEventListener('unlock', onUnlock)
        elements.forEach((element) => (element ? element.removeEventListener('click', handler) : undefined))
      }
    }, [onChange, onLock, onUnlock, selector])

    return <primitive ref={ref} object={controls} {...rest} />
  }
)
