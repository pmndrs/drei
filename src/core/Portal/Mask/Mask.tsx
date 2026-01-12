import * as THREE from '#three'
import * as React from 'react'
import { ForwardRefComponent } from '../../../utils/ts-utils'
import { ThreeElements, useThree } from '@react-three/fiber'

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
export const Mask: ForwardRefComponent<MaskProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<THREE.Mesh, MaskProps>(
  ({ id = 1, colorWrite = false, depthWrite = false, children, ...props }, fref) => {
    const ref = React.useRef<THREE.Mesh>(null!)
    const renderer = useThree((state) => state.renderer)
    const stencilReady = React.useRef(false)
    const [ready, setReady] = React.useState(false)

    React.useImperativeHandle(fref, () => ref.current, [])

    //* Ensure stencil is enabled on the renderer ---------------------------------
    React.useLayoutEffect(() => {
      if (stencilReady.current) return

      // Check for WebGPURenderer first (has 'backend' property)
      if ('backend' in renderer) {
        // WebGPU - stencil should be available, mark as ready
        renderer.stencil = true
        renderer.stencilWrite = true

        stencilReady.current = true
        setReady(true)
        return
      }

      // For WebGLRenderer, check context attributes
      const webglRenderer = renderer as THREE.WebGLRenderer
      ;(webglRenderer as any).stencil = true
      if (webglRenderer.getContext && typeof webglRenderer.getContext === 'function') {
        const context = webglRenderer.getContext()
        if (context && 'getContextAttributes' in context) {
          const attributes = context.getContextAttributes()
          if (!attributes?.stencil) {
            console.warn(
              '[Mask] Stencil buffer is not enabled. Pass gl={{ stencil: true }} to Canvas for stencil masking to work.'
            )
          }
        }
        stencilReady.current = true
        setReady(true)
        return
      }

      // Fallback - just mark as ready
      stencilReady.current = true
      setReady(true)
    }, [renderer])

    // Don't render stencil material until ready
    if (!ready) {
      return (
        <mesh ref={ref} renderOrder={-id} {...props}>
          {children}
        </mesh>
      )
    }

    return (
      <mesh ref={ref} renderOrder={-id} {...props}>
        {children}
        <meshBasicMaterial
          colorWrite={colorWrite}
          depthWrite={depthWrite}
          stencilWrite={true}
          stencilRef={id}
          stencilFunc={THREE.AlwaysStencilFunc}
          stencilFail={THREE.ReplaceStencilOp}
          stencilZFail={THREE.ReplaceStencilOp}
          stencilZPass={THREE.ReplaceStencilOp}
        />
      </mesh>
    )
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
