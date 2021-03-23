import * as React from 'react'
import { useThree } from '@react-three/fiber'

export function AdaptiveDpr({ pixelated }: { pixelated?: boolean }) {
  const gl = useThree((state) => state.gl)
  const current = useThree((state) => state.performance.current)
  const initialDpr = useThree((state) => state.viewport.initialDpr)
  const setDpr = useThree((state) => state.setDpr)
  // Restore initial pixelratio on unmount
  React.useEffect(
    () => () => {
      setDpr(initialDpr)
      if (pixelated) gl.domElement.style.imageRendering = 'auto'
    },
    []
  )
  // Set adaptive pixelratio
  React.useEffect(() => {
    setDpr(current * initialDpr)
    if (pixelated) gl.domElement.style.imageRendering = current === 1 ? 'auto' : 'pixelated'
  }, [current])
  return null
}
