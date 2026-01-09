import { ForwardRefComponent } from '../../../utils/ts-utils'
import { addAfterEffect, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'

import Stats from 'stats-gl'

type StatsOptions = ConstructorParameters<typeof Stats>[0]

export type StatsGlProps = Partial<StatsOptions> & {
  id?: string
  clearStatsGlStyle?: boolean
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
  ref?: React.RefObject<HTMLElement>
}

/**
 * WebGL-based stats monitor using stats-gl. Shows FPS, CPU, GPU metrics.
 *
 * @example
 * ```jsx
 * <Canvas><StatsGl /></Canvas>
 * ```
 */
export const StatsGl: ForwardRefComponent<StatsGlProps, HTMLDivElement> = /* @__PURE__ */ React.forwardRef(
  function StatsGl({ className, parent, id, clearStatsGlStyle, ...props }, fref) {
    const { renderer } = useThree()

    const stats = React.useMemo(() => {
      const stats = new Stats({
        ...props,
      })
      return stats
    }, [renderer])

    React.useImperativeHandle(fref, () => stats.domElement, [stats])

    React.useEffect(() => {
      if (stats) {
        const node = (parent && parent.current) || document.body
        node?.appendChild(stats.domElement)
        stats.domElement.querySelectorAll('canvas').forEach((canvas) => {
          canvas.style.removeProperty('position')
        })
        if (id) stats.domElement.id = id
        if (clearStatsGlStyle) stats.domElement.removeAttribute('style')
        const classNames = (className ?? '').split(' ').filter((cls) => cls)
        if (classNames.length) stats.domElement.classList.add(...classNames)
        return () => {
          if (classNames.length) stats.domElement.classList.remove(...classNames)
          node?.removeChild(stats.domElement)
          // odd call for a final end
          stats.end()
        }
      }
    }, [parent, stats, className, id, clearStatsGlStyle])

    // attach stats to renderer
    useFrame(
      () => {
        stats.begin()
      },
      { before: 'render' }
    )
    useFrame(
      () => {
        stats.end()
      },
      { after: 'render' }
    )
    // update
    useFrame(
      () => {
        stats.update()
      },
      { phase: 'end' }
    )

    return null
  }
)
