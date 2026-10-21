import { useEffect } from 'react'
import { useThree } from '@react-three/fiber/legacy'

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
  const renderer = useThree((state) => state.renderer)
  useEffect(() => {
    renderer.shadowMap.autoUpdate = false
    renderer.shadowMap.needsUpdate = true
    return () => {
      renderer.shadowMap.autoUpdate = renderer.shadowMap.needsUpdate = true
    }
  }, [renderer.shadowMap])
  return null
}
