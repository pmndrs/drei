import * as React from 'react'
import { ThreeElements } from '@react-three/fiber'
import { DiscardNodeMaterial } from '@webgpu/Materials/DiscardMaterial'
import { ForwardRefComponent } from '@utils/ts-utils'

/**
 * Props mirror the legacy component, which forwards `shaderMaterial` props to a
 * GLSL `ShaderMaterial`. The WebGPU implementation is a `MeshBasicNodeMaterial`
 * subclass, so the forwarded surface is `meshBasicMaterial` instead — the
 * `uniforms`/`vertexShader`/`fragmentShader` props of the legacy type have no
 * meaning here, and every prop that does anything (side, transparent, opacity,
 * depthWrite, colorWrite, polygonOffset, …) is common to both.
 */
export type MeshDiscardMaterialProps = Omit<ThreeElements['meshBasicMaterial'], 'ref'>

/**
 * Material that discards all fragments (renders nothing).
 * Useful for invisible meshes that still cast shadows or interact with raycasting.
 *
 * @example Shadow-only mesh
 * ```jsx
 * <mesh castShadow>
 *   <planeGeometry />
 *   <MeshDiscardMaterial />
 * </mesh>
 * ```
 */
export const MeshDiscardMaterial: ForwardRefComponent<MeshDiscardMaterialProps, DiscardNodeMaterial> =
  /* @__PURE__ */ React.forwardRef((props, fref) => {
    // One material per element, matching the legacy wrapper — the shared
    // `DiscardMaterial` singleton would leak prop changes between elements.
    const [material] = React.useState(() => new DiscardNodeMaterial())
    return <primitive object={material} ref={fref} attach="material" {...props} />
  })
