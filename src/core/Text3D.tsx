import * as React from 'react'
import * as THREE from 'three'
import { extend, MeshProps, Node } from '@react-three/fiber'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { suspend } from 'suspend-react'
import { TextGeometry, FontLoader, TextGeometryParameters } from 'three-stdlib'

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
} & Omit<TextGeometryParameters, 'font'> &
  MeshProps

const types = ['string', 'number']
const getTextFromChildren = (children) => {
  let label = ''

  React.Children.map(children, (child) => {
    if (types.includes(typeof child)) {
      label += child + ''
    }
  })

  return label
}

const Text3DBase = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps & { loader: FontLoader }>>(
  (
    {
      font,
      loader,
      size = 1,
      height = 0.2,
      bevelThickness = 0.1,
      bevelSize = 0.01,
      bevelEnabled = false,
      bevelOffset = 0,
      curveSegments = 8,
      children,
      ...props
    },
    ref
  ) => {
    React.useMemo(() => {
      extend({ RenamedTextGeometry: TextGeometry })
    }, [])

    const _font = React.useMemo(() => loader.parse(font as FontData), [font])
    const opts = useMemo(() => {
      return {
        font: _font,
        size,
        height,
        bevelThickness,
        bevelSize,
        bevelEnabled,
        bevelOffset,
        curveSegments,
      }
    }, [_font, size, height, bevelThickness, bevelSize, bevelEnabled, bevelOffset, curveSegments])

    /**
     * We need the `children` in the deps because we
     * need to be able to do `<Text3d>{state}</Text3d>`.
     */
    const txt = useMemo(() => getTextFromChildren(children), [children])
    const args = React.useMemo(() => [txt, opts], [txt, opts])

    return (
      <mesh {...props} ref={ref}>
        <renamedTextGeometry args={args} />
        {children}
      </mesh>
    )
  }
)

const Text3DSuspend = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps & { loader: FontLoader }>>(
  ({ font, loader, ...props }, ref) => {
    const _font = suspend(async () => {
      const json = await (await fetch(font as string)).json()
      return json
    }, [font])

    return <Text3DBase {...props} ref={ref} font={_font as FontData} loader={loader} />
  }
)

export const Text3D = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps>>((props, ref) => {
  const loader = React.useMemo(() => new FontLoader(), [])

  if (typeof props.font === 'string') {
    return <Text3DSuspend {...props} ref={ref} loader={loader} />
  } else {
    return <Text3DBase {...props} ref={ref} loader={loader} />
  }
})
