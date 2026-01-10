import * as React from 'react'
import { Object3D, Frustum, Matrix4 } from '#three'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Detects when an object enters/exits the camera frustum.
 * Fires callback when visibility changes.
 *
 * @example Basic usage
 * ```jsx
 * const ref = useIntersect((visible) => console.log('visible:', visible))
 * return <mesh ref={ref} />
 * ```
 */
export function useIntersect<T extends Object3D>(onChange: (visible: boolean) => void) {
  const { isLegacy } = useThree()
  const ref = React.useRef<T>(null!)
  const currentStatus = React.useRef(false)
  const previousStatus = React.useRef(false)
  const callback = React.useRef(onChange)

  const { frustum, projScreenMatrix } = React.useMemo(() => {
    const newFrust = new Frustum()
    const projectionScreenMatrix = new Matrix4()
    return { frustum: newFrust, projScreenMatrix: projectionScreenMatrix }
  }, [])
  // If the callback changes later, update the ref
  React.useLayoutEffect(() => void (callback.current = onChange), [onChange])

  // Stamp out frustum check pre-emptively
  useFrame(
    () => {
      if (ref.current) currentStatus.current = false
    },
    { phase: 'start' }
  )

  // Compare the check value against the temp value, if it differs set state
  useFrame(
    ({ isLegacy, camera }) => {
      const object = ref.current
      if (!ref.current) return
      // visibility is checked by the onbeforerender in webgl so handled for us
      let visibleNow = currentStatus.current
      let wasVisible = previousStatus.current

      if (!isLegacy) {
        // webgpu we do a oclussion check and a render check
        // update the frustum if the camera has changed
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        frustum.setFromProjectionMatrix(projScreenMatrix, camera.coordinateSystem, camera.reversedDepth)
        // check if the object is visible
        visibleNow = frustum.intersectsObject(object)
      }

      // if things are the same bail
      if (visibleNow === wasVisible) return

      // update and fire the callback
      previousStatus.current = visibleNow
      callback.current?.(visibleNow)
    },
    { phase: 'end' }
  )

  React.useEffect(() => {
    const obj = ref.current
    if (obj && isLegacy) {
      // If the object is inside the frustum three will call onRender
      const oldOnRender = obj.onBeforeRender
      obj.onBeforeRender = () => (currentStatus.current = true)

      return () => {
        // cleanup and turn off our loops, might not be needed with new useFrame
        obj.onBeforeRender = oldOnRender
      }
    }
  }, [isLegacy])
  return ref
}
