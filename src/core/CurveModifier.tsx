import * as React from 'react'
import * as THREE from 'three'
import { Flow } from 'three-stdlib/modifiers/CurveModifier'

export interface CurveModifierProps {
  children: React.ReactElement<JSX.IntrinsicElements['mesh']>
  curve?: THREE.Curve<THREE.Vector3>
}

export type CurveModifierRef = Pick<Flow, 'moveAlongCurve'>

export const CurveModifier = React.forwardRef(({ children, curve }: CurveModifierProps, ref) => {
  const [object3D, setObj] = React.useState<THREE.Object3D | undefined>()
  const original = React.useRef<THREE.Mesh>()
  const modifier = React.useRef<Flow>()

  React.useImperativeHandle(ref, () => ({
    moveAlongCurve: (val) => {
      modifier.current?.moveAlongCurve(val)
    },
  }))

  React.useEffect(() => {
    if (!modifier.current && original.current && ref) {
      modifier.current = new Flow(original.current)
      setObj(modifier.current.object3D)
    }
  }, [children, ref])

  React.useEffect(() => {
    if (original.current && curve) {
      modifier.current?.updateCurve(0, curve)
    }
  }, [curve])

  return object3D ? (
    <primitive object={object3D} />
  ) : (
    React.cloneElement(React.Children.only(children), {
      ref: original,
    })
  )
})
