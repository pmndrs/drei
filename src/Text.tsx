import React, { Children, forwardRef, useMemo, useLayoutEffect, useState } from 'react'
import { Text as TextMeshImpl } from 'troika-three-text'
import { ReactThreeFiber, useThree } from 'react-three-fiber'

type Props = JSX.IntrinsicElements['mesh'] & {
  children: React.ReactNode
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
  overflowWrap?: 'normal' | 'break-word'
  whiteSpace?: 'normal' | 'overflowWrap' | 'overflowWrap'
  outlineWidth?: number | string
  outlineColor?: ReactThreeFiber.Color
  onSync?: (troika: TextMeshImpl) => void
}

export const Text = forwardRef(({ anchorX = 'center', anchorY = 'middle', children, onSync, ...props }: Props, ref) => {
  const { invalidate } = useThree()
  const [troikaMesh] = useState(() => new TextMeshImpl())
  const [nodes, text] = useMemo(() => {
    let n: React.ReactNode[] = []
    let t = ''
    Children.forEach(children, (child) => {
      if (typeof child === 'string') {
        t += child
      } else {
        n.push(child)
      }
    })
    return [n, t]
  }, [children])
  useLayoutEffect(
    () =>
      void troikaMesh.sync(() => {
        invalidate()
        if (onSync) onSync(troikaMesh)
      })
  )
  return (
    <primitive dispose={null} object={troikaMesh} ref={ref} text={text} anchorX={anchorX} anchorY={anchorY} {...props}>
      {nodes}
    </primitive>
  )
})
