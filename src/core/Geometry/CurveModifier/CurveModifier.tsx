import * as React from 'react'
import * as THREE from '#three'
import { createPortal, ThreeElements } from '@react-three/fiber'
import { Flow } from 'three-stdlib'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export interface CurveModifierProps {
  /** The mesh to deform along the curve */
  children: React.ReactElement<ThreeElements['mesh']>
  /** The curve to follow. Use THREE.CatmullRomCurve3 or any THREE.Curve */
  curve?: THREE.Curve<THREE.Vector3>
}

export type CurveModifierRef = Flow

/**
 * Deforms a mesh so it follows a curve. Based on three.js Curve Modifier.
 * Use the ref to move along the curve via `moveAlongCurve()` or `uniforms.pathOffset`.
 *
 * @example Basic usage
 * ```jsx
 * const curveRef = useRef()
 * const curve = new THREE.CatmullRomCurve3([...points], true, 'centripetal')
 *
 * useFrame(() => curveRef.current?.moveAlongCurve(0.001))
 *
 * <CurveModifier ref={curveRef} curve={curve}>
 *   <mesh>
 *     <boxGeometry args={[10, 10]} />
 *   </mesh>
 * </CurveModifier>
 * ```
 *
 * @example With scroll controls
 * ```jsx
 * const curveRef = useRef()
 * const scroll = useScroll()
 *
 * useFrame(() => {
 *   curveRef.current.uniforms.pathOffset.value = scroll.offset
 * })
 *
 * <CurveModifier ref={curveRef} curve={curve}>
 *   <mesh><boxGeometry /></mesh>
 * </CurveModifier>
 * ```
 */
export const CurveModifier: ForwardRefComponent<CurveModifierProps, CurveModifierRef> =
  /* @__PURE__ */ React.forwardRef(({ children, curve }: CurveModifierProps, ref) => {
    const [scene] = React.useState(() => new THREE.Scene())
    const [obj, set] = React.useState<THREE.Object3D>()
    const modifier = React.useRef<Flow>(null!)

    React.useLayoutEffect(() => {
      modifier.current = new Flow(
        scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>
      )
      set(modifier.current.object3D)
    }, [children])

    React.useEffect(() => {
      if (curve) modifier.current?.updateCurve(0, curve)
    }, [curve])

    React.useImperativeHandle(ref, () => modifier.current)

    return (
      <>
        {createPortal(children, scene)}
        {obj && <primitive object={obj} />}
      </>
    )
  })
