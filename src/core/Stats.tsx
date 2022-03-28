import * as React from 'react'
import { addEffect, addAfterEffect } from '@react-three/fiber'
import StatsImpl from 'stats.js'
import { useEffectfulState } from '../helpers/useEffectfulState'

type Props = {
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
}

export function Stats({ showPanel = 0, className, parent }: Props): null {
  const stats = useEffectfulState(() => new StatsImpl(), [])
  React.useEffect(() => {
    if (stats) {
      const node = (parent && parent.current) || document.body
      stats.showPanel(showPanel)
      node?.appendChild(stats.dom)
      if (className) stats.dom.classList.add(...className.split(' ').filter((cls) => cls))
      const begin = addEffect(() => stats.begin())
      const end = addAfterEffect(() => stats.end())
      return () => {
        node?.removeChild(stats.dom)
        begin()
        end()
      }
    }
  }, [parent, stats, className, showPanel])
  return null
}
