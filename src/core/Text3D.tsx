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

const Text3DBase = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps & { loader: FontLoader }>>(
  ({ font, loader, size = 1, height = 0.2, bevelThickness = 0.1, bevelSize = 0.01, children, ...props }, ref) => {
    const _font = React.useMemo(() => loader.parse(font as FontData), [font])

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

const Text3DSuspend = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps & { loader: FontLoader }>>(
  ({ font, loader, ...props }, ref) => {
    const _font = suspend(async () => {
      const json = await (await fetch(font as string)).json()
      return json
    }, [font])

    return <Text3DBase ref={ref} {...props} font={_font as FontData} loader={loader} />
  }
)

export const Text3D = React.forwardRef<THREE.Mesh, React.PropsWithChildren<Text3DProps>>((props, ref) => {
  const loader = React.useMemo(() => new FontLoader(), [])

  if (typeof props.font === 'string') {
    return <Text3DSuspend ref={ref} {...props} loader={loader} />
  } else {
    return <Text3DBase ref={ref} {...props} loader={loader} />
  }
})
