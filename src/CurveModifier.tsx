import * as React from 'react'
import * as THREE from 'three'
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier'

interface CurveModifierProps {
  children: React.ReactElement<JSX.IntrinsicElements['mesh']>
  curve?: THREE.Curve<THREE.Vector2 | THREE.Vector3 | THREE.Vector4>
}

const CurveModifier = React.forwardRef(({ children, curve }: CurveModifierProps, ref) => {
  const [object3D, setObj] = React.useState()
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

export default CurveModifier
