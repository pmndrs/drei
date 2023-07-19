import * as React from 'react'
import { addEffect, addAfterEffect, useThree } from '@react-three/fiber'
import Stats from 'stats-gl'

type Props = Partial<Stats> & {
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
}

export function StatsGl({ className, parent, ...props }: Props) {
  const gl = useThree((state) => state.gl)

  const stats = React.useMemo(() => {
    const stats = new Stats({
      ...props,
    })
    stats.init(gl.domElement)
    return stats
  }, [gl])

  React.useEffect(() => {
    if (stats) {
      const node = (parent && parent.current) || document.body
      node?.appendChild(stats.container)
      if (className) stats.container.classList.add(...className.split(' ').filter((cls) => cls))
      const begin = addEffect(() => stats.begin())
      const end = addAfterEffect(() => stats.end())
      return () => {
        node?.removeChild(stats.container)
        begin()
        end()
      }
    }
  }, [parent, stats, className])
  return null
}
