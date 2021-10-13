import * as React from 'react'
import { useThree } from '@react-three/fiber'

export function AdaptiveEvents() {
  const get = useThree((state) => state.get)
  const current = useThree((state) => state.performance.current)
  React.useEffect(() => {
    const enabled = get().raycaster.enabled
    return () => void (get().raycaster.enabled = enabled)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => void (get().raycaster.enabled = current === 1), [current])
  return null
}
