import { extend, Node } from '@react-three/fiber'
import * as React from 'react'
import { suspend } from 'suspend-react'
import * as THREE from 'three'
import { TextGeometry, FontLoader, TextGeometryParameters } from 'three-stdlib'

extend({ RenamedTextGeometry: TextGeometry })

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
} & Omit<TextGeometryParameters, 'font'>

const getTextFromChildren = (children) => {
  let label = ''

  React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      label = child
    }
  })

  return label
}

export const Text3D = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps>>(
  ({ font, size = 1, height = 0.2, bevelThickness = 0.1, bevelSize = 0.01, children, ...props }, ref) => {
    const loader = React.useMemo(() => new FontLoader(), [])
    const _font = suspend(async () => {
      if (typeof font === 'string') {
        const json = await (await fetch(font)).json()
        return loader.parse(json)
      } else {
        return loader.parse(font)
      }
    }, [font])

    return (
      <mesh ref={ref}>
        <renamedTextGeometry
          args={[
            getTextFromChildren(children),
            {
              font: _font,
              size,
              height,
              bevelThickness,
              bevelSize,
              ...props,
            },
          ]}
        />
        {children}
      </mesh>
    )
  }
)
