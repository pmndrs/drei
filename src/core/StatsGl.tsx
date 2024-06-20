import * as React from 'react'
import { addAfterEffect, useThree } from '@react-three/fiber'
import Stats from 'stats-gl'

type Props = Partial<Stats> & {
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
}

export function StatsGl({ className, parent, ...props }: Props) {
  const gl: any = useThree((state) => state.gl)

  const stats = React.useMemo(() => {
    const stats = new Stats({
      ...props,
    })
    stats.init(gl)
    return stats
  }, [gl])

  React.useEffect(() => {
    if (stats) {
      const node = (parent && parent.current) || document.body
      node?.appendChild(stats.dom)
      const classNames = (className ?? '').split(' ').filter((cls) => cls)
      if (classNames.length) stats.dom.classList.add(...classNames)
      const end = addAfterEffect(() => stats.update())
      return () => {
        if (classNames.length) stats.dom.classList.remove(...classNames)
        node?.removeChild(stats.dom)
        end()
      }
    }
  }, [parent, stats, className])
  return null
}
