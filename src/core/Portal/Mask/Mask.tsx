import * as THREE from '#three'
import * as React from 'react'
import { ForwardRefComponent } from '../../../utils/ts-utils'
import { ThreeElements } from '@react-three/fiber'

export type MaskProps = Omit<ThreeElements['mesh'], 'ref' | 'id'> & {
  /** Each mask must have an id, you can have compound masks referring to the same id */
  id: number
  /** If colors of the masks own material will leak through, default: false */
  colorWrite?: boolean
  /** If depth  of the masks own material will leak through, default: false */
  depthWrite?: boolean
}

/**
 * Stencil buffer mask - cuts out areas of the screen.
 * Cheaper than createPortal as it doesn't require double renders.
 * Use `useMask(id)` to apply the mask to materials.
 *
 * @example Define mask and apply to mesh
 * ```jsx
 * <Mask id={1}>
 *   <planeGeometry />
 * </Mask>
 * 
 * function MaskedMesh() {
 *   const stencil = useMask(1)
 *   return <mesh><meshStandardMaterial {...stencil} /></mesh>
 * }
 * ```
 *
 * @example Compound mask (multiple shapes, same id)
 * ```jsx
 * <Mask id={1} position={[-1, 0, 0]}><planeGeometry /></Mask>
 * <Mask id={1} position={[1, 0, 0]}><circleGeometry /></Mask>
 * ```
 */
export const Mask: ForwardRefComponent<MaskProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ id = 1, colorWrite = false, depthWrite = false, ...props }: MaskProps, fref: React.ForwardedRef<THREE.Mesh>) => {
    const ref = React.useRef<THREE.Mesh>(null!)
    const spread = React.useMemo(
      () => ({
        colorWrite,
        depthWrite,
        stencilWrite: true,
        stencilRef: id,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
      [id, colorWrite, depthWrite]
    )
    React.useLayoutEffect(() => {
      Object.assign(ref.current.material, spread)
    })
    React.useImperativeHandle(fref, () => ref.current, [])
    return <mesh ref={ref} renderOrder={-id} {...props} />
  }
)

/**
 * Returns stencil properties to apply to a material for masking.
 * @param id - The mask id to match
 * @param inverse - If true, inverts the mask (shows where mask is NOT)
 */
export function useMask(id: number, inverse: boolean = false) {
  return {
    stencilWrite: true,
    stencilRef: id,
    stencilFunc: inverse ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  }
}
