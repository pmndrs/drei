import * as React from 'react'
// @ts-ignore
import { Text as TextMeshImpl, preloadFont } from 'troika-three-text'
import { ReactThreeFiber, useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'

type Props = JSX.IntrinsicElements['mesh'] & {
  children: React.ReactNode
  characters?: string
  color?: ReactThreeFiber.Color
  fontSize?: number
  maxWidth?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'right' | 'center' | 'justify'
  font?: string
  anchorX?: number | 'left' | 'center' | 'right'
  anchorY?: number | 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
  clipRect?: [number, number, number, number]
  depthOffset?: number
  direction?: 'auto' | 'ltr' | 'rtl'
  overflowWrap?: 'normal' | 'break-word'
  whiteSpace?: 'normal' | 'overflowWrap' | 'overflowWrap'
  outlineWidth?: number | string
  outlineOffsetX?: number | string
  outlineOffsetY?: number | string
  outlineBlur?: number | string
  outlineColor?: ReactThreeFiber.Color
  outlineOpacity?: number
  strokeWidth?: number | string
  strokeColor?: ReactThreeFiber.Color
  strokeOpacity?: number
  fillOpacity?: number
  debugSDF?: boolean
  onSync?: (troika: any) => void
}

// eslint-disable-next-line prettier/prettier
export const Text = React.forwardRef(
  ({ anchorX = 'center', anchorY = 'middle', font, children, characters, onSync, ...props }: Props, ref) => {
    const invalidate = useThree(({ invalidate }) => invalidate)
    const [troikaMesh] = React.useState(() => new TextMeshImpl())

    const [nodes, text] = React.useMemo(() => {
      const n: React.ReactNode[] = []
      let t = ''
      React.Children.forEach(children, (child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          t += child
        } else {
          n.push(child)
        }
      })
      return [n, t]
    }, [children])

    suspend(() => new Promise((res) => preloadFont({ font, characters }, res)), ['troika-text', font, characters])

    React.useLayoutEffect(
      () =>
        void troikaMesh.sync(() => {
          invalidate()
          if (onSync) onSync(troikaMesh)
        })
    )

    React.useEffect(() => {
      return () => troikaMesh.dispose()
    }, [troikaMesh])

    return (
      <primitive object={troikaMesh} ref={ref} font={font} text={text} anchorX={anchorX} anchorY={anchorY} {...props}>
        {nodes}
      </primitive>
    )
  }
)
