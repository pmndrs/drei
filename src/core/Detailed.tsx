import * as React from 'react'
import { LOD, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'

type Props = JSX.IntrinsicElements['lOD'] & {
  children: React.ReactElement<Object3D>[]
  distances: number[]
}

export const Detailed = React.forwardRef(({ children, distances, ...props }: Props, ref) => {
  const lod = React.useRef<LOD>(null!)
  React.useImperativeHandle(ref, () => lod.current)
  React.useLayoutEffect(() => {
    lod.current.levels.length = 0
    lod.current.children.forEach((object, index) => lod.current.levels.push({ object, distance: distances[index] }))
  })
  useFrame((state) => lod.current.update(state.camera))
  return (
    <lOD ref={lod} {...props}>
      {children}
    </lOD>
  )
})
