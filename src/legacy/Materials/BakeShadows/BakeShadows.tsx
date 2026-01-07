import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Disables shadow map auto-update for baked, non-moving lights.
 * Renders shadows once and freezes them for better performance.
 *
 * @example
 * ```jsx
 * <Canvas shadows><BakeShadows /></Canvas>
 * ```
 */
export function BakeShadows() {
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = gl.shadowMap.needsUpdate = true
    }
  }, [gl.shadowMap])
  return null
}
