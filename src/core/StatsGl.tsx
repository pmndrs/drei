import { ForwardRefComponent } from '../helpers/ts-utils'
import { addAfterEffect, useThree } from '@react-three/fiber'
import * as React from 'react'

import Stats from 'stats-gl'

type StatsProps = ConstructorParameters<typeof Stats>[number]

type Props = Partial<StatsProps> & {
  id?: string
  clearStatsGlStyle?: boolean
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
  ref?: React.RefObject<HTMLElement>
}

export const StatsGl: ForwardRefComponent<Props, HTMLDivElement> = /* @__PURE__ */ React.forwardRef(
  ({ className, parent, id, clearStatsGlStyle, ...props }: Props, fref) => {
    const gl: any = useThree((state) => state.gl)

    const stats = React.useMemo(() => {
      const stats = new Stats({
        ...props,
      })
      stats.init(gl)
      return stats
    }, [gl])

    React.useImperativeHandle(fref, () => stats.dom)

    React.useEffect(() => {
      if (stats) {
        const node = (parent && parent.current) || document.body
        node?.appendChild(stats.dom)
        stats.dom.querySelectorAll('canvas').forEach((canvas) => {
          canvas.style.removeProperty('position')
        })
        if (id) stats.dom.id = id
        if (clearStatsGlStyle) stats.dom.removeAttribute('style')
        stats.dom.removeAttribute('style')
        const classNames = (className ?? '').split(' ').filter((cls) => cls)
        if (classNames.length) stats.dom.classList.add(...classNames)
        const end = addAfterEffect(() => stats.update())
        return () => {
          if (classNames.length) stats.dom.classList.remove(...classNames)
          node?.removeChild(stats.dom)
          end()
        }
      }
    }, [parent, stats, className, id, clearStatsGlStyle])

    return null
  }
)

StatsGl.displayName = 'StatsGl'
