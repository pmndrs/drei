import * as React from 'react'
import { LOD, Object3D } from 'three'
import { useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

type Props = JSX.IntrinsicElements['lOD'] & {
  children: React.ReactElement<Object3D>[]
  distances: number[]
}

export const Detailed = React.forwardRef(({ children, distances, ...props }: Props, ref) => {
  const lodRef = React.useRef<LOD>(null!)
  React.useLayoutEffect(() => {
    const { current: lod } = lodRef
    lod.levels.length = 0
    lod.children.forEach((object, index) => lod.levels.push({ object, distance: distances[index] }))
  })
  useFrame((state) => lodRef.current?.update(state.camera))
  return (
    <lOD ref={mergeRefs([lodRef, ref])} {...props}>
      {children}
    </lOD>
  )
})
