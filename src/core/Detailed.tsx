import * as React from 'react'
import { LOD, Object3D } from 'three'
import { useFrame, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

type Props = ThreeElements['lOD'] & {
  children: React.ReactElement<Object3D>[]
  hysteresis?: number
  distances: number[]
}

export const Detailed: ForwardRefComponent<Props, LOD> = /* @__PURE__ */ React.forwardRef(
  ({ children, hysteresis = 0, distances, ...props }: Props, ref) => {
    const lodRef = React.useRef<LOD>(null!)
    React.useImperativeHandle(ref, () => lodRef.current, [])
    React.useLayoutEffect(() => {
      const { current: lod } = lodRef
      lod.levels.length = 0
      lod.children.forEach((object, index) => lod.levels.push({ object, hysteresis, distance: distances[index] }))
    })
    useFrame((state) => lodRef.current?.update(state.camera))
    return (
      <lOD ref={lodRef} {...props}>
        {children}
      </lOD>
    )
  }
)
