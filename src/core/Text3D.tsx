import * as React from 'react'
import * as THREE from 'three'
import { extend, MeshProps, Node } from '@react-three/fiber'
import { useMemo } from 'react'
import { suspend } from 'suspend-react'
import { TextGeometry, TextGeometryParameters, FontLoader } from 'three-stdlib'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      renamedTextGeometry: Node<any, any>
    }
  }
}

declare type Glyph = {
  _cachedOutline: string[]
  ha: number
  o: string
}

declare type FontData = {
  boundingBox: {
    yMax: number
    yMin: number
  }
  familyName: string
  glyphs: {
    [k: string]: Glyph
  }
  resolution: number
  underlineThickness: number
}

type Text3DProps = {
  font: FontData | string
  bevelSegments?: number
} & Omit<TextGeometryParameters, 'font'> &
  MeshProps

const types = ['string', 'number']
const getTextFromChildren = (children) => {
  let label = ''
  const rest: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (types.includes(typeof child)) label += child + ''
    else rest.push(child)
  })
  return [label, ...rest]
}

export const Text3D = React.forwardRef<
  THREE.Mesh,
  React.PropsWithChildren<Text3DProps & { letterSpacing?: number; lineHeight?: number }>
>(
  (
    {
      font: _font,
      letterSpacing = 0,
      lineHeight = 1,
      size = 1,
      height = 0.2,
      bevelThickness = 0.1,
      bevelSize = 0.01,
      bevelEnabled = false,
      bevelOffset = 0,
      bevelSegments = 4,
      curveSegments = 8,
      children,
      ...props
    },
    ref
  ) => {
    React.useMemo(() => extend({ RenamedTextGeometry: TextGeometry }), [])

    const font = suspend(async () => {
      let data = typeof _font === 'string' ? await (await fetch(_font as string)).json() : _font
      let loader = new FontLoader()
      return loader.parse(data as FontData)
    }, [_font])

    const opts = useMemo(() => {
      return {
        font,
        size,
        height,
        bevelThickness,
        bevelSize,
        bevelEnabled,
        bevelSegments,
        bevelOffset,
        curveSegments,
        letterSpacing,
        lineHeight,
      }
    }, [
      font,
      size,
      height,
      bevelThickness,
      bevelSize,
      bevelEnabled,
      bevelSegments,
      bevelOffset,
      curveSegments,
      letterSpacing,
      lineHeight,
    ])

    /**
     * We need the `children` in the deps because we
     * need to be able to do `<Text3d>{state}</Text3d>`.
     */
    const [label, ...rest] = useMemo(() => getTextFromChildren(children), [children])
    const args = React.useMemo(() => [label, opts], [label, opts])

    return (
      <mesh {...props} ref={ref}>
        <renamedTextGeometry args={args} />
        {rest}
      </mesh>
    )
  }
)
