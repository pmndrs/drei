import * as React from 'react'
import { addEffect, addAfterEffect } from '@react-three/fiber'
// @ts-ignore
import StatsImpl from 'stats.js'
import { useEffectfulState } from '../../../utils/useEffectfulState'

export type StatsProps = {
  /** Panel to show: 0=fps, 1=ms, 2=mb, 3+=custom. @default 0 */
  showPanel?: number
  /** CSS class for the stats element */
  className?: string
  /** Parent element to append stats to */
  parent?: React.RefObject<HTMLElement>
}

/**
 * Displays stats.js performance monitor (FPS, MS, MB).
 *
 * @example
 * ```jsx
 * <Canvas><Stats showPanel={0} /></Canvas>
 * ```
 */
export function Stats({ showPanel = 0, className, parent }: StatsProps): null {
  React.useEffect(() => void console.warn('drei: <Stats /> is deprecated, use <StatsGl /> instead.'), [])
  const stats = useEffectfulState(() => new StatsImpl(), [])
  React.useEffect(() => {
    if (!stats) return
    // Stats measures the entire shared frame, including every Canvas. A useFrame
    // subscription belongs to one root and stops when that root becomes idle.
    // Keep these global callbacks until Fiber provides a replacement with that scope.
    const begin = addEffect(() => stats.begin())
    const end = addAfterEffect(() => stats.end())
    return () => {
      begin()
      end()
    }
  }, [stats])
  React.useEffect(() => {
    if (stats) {
      const node = (parent && parent.current) || document.body
      stats.showPanel(showPanel)
      node?.appendChild(stats.dom)
      const classNames = (className ?? '').split(' ').filter((cls) => cls)
      if (classNames.length) stats.dom.classList.add(...classNames)
      return () => {
        if (classNames.length) stats.dom.classList.remove(...classNames)
        node?.removeChild(stats.dom)
      }
    }
  }, [parent, stats, className, showPanel])
  return null
}
