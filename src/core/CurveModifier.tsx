import * as React from 'react'
import * as THREE from 'three'
import { createPortal } from '@react-three/fiber'
import { Flow } from 'three-stdlib'

export interface CurveModifierProps {
  children: React.ReactElement<JSX.IntrinsicElements['mesh']>
  curve?: THREE.Curve<THREE.Vector3>
}

export type CurveModifierRef = Pick<Flow, 'moveAlongCurve'>

export const CurveModifier = React.forwardRef(({ children, curve }: CurveModifierProps, ref) => {
  const [scene] = React.useState(() => new THREE.Scene())
  const [obj, set] = React.useState<THREE.Object3D>()
  const modifier = React.useRef<Flow>()

  React.useEffect(() => {
    modifier.current = new Flow(
      scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>
    )
    set(modifier.current.object3D)
  }, [children])

  React.useEffect(() => {
    if (curve) modifier.current?.updateCurve(0, curve)
  }, [curve])

  React.useImperativeHandle(ref, () => ({
    moveAlongCurve: (val: number) => {
      modifier.current?.moveAlongCurve(val)
    },
  }))

  return (
    <>
      {createPortal(children, scene)}
      {obj && <primitive object={obj} />}
    </>
  )
})
