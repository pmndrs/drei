import * as React from 'react'
import { useThree } from '@react-three/fiber'

export function BakeShadows() {
  const gl = useThree((state) => state.gl)
  React.useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => {
      gl.shadowMap.autoUpdate = gl.shadowMap.needsUpdate = true
    }
  }, [])
  return null
}
