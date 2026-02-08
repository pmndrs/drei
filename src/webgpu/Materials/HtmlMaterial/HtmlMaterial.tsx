import * as React from 'react'
import { DoubleSide } from 'three/webgpu'
import { SpriteNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu'
import { vec4 } from 'three/tsl'

/**
 * Transparent occlusion material for Html blending mode (WebGPU/TSL).
 *
 * When transform=false, uses SpriteNodeMaterial to billboard the plane
 * (always face the camera), matching the legacy GLSL SpriteMaterial vertex shader.
 * When transform=true, uses MeshBasicNodeMaterial with default vertex processing.
 *
 * Fragment always outputs fully transparent vec4(0,0,0,0) — the mesh is invisible
 * but participates in z-sorting so HTML content can blend behind 3D objects.
 */
function createHtmlNodeMaterial(transform: boolean) {
  const mat = transform ? new MeshBasicNodeMaterial() : new SpriteNodeMaterial()
  mat.side = DoubleSide
  mat.transparent = true
  mat.depthWrite = true
  mat.fragmentNode = vec4(0, 0, 0, 0)
  return mat
}

export const HtmlMaterial = ({ transform }: { transform: boolean }) => {
  const material = React.useMemo(() => createHtmlNodeMaterial(transform), [transform])

  React.useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return <primitive object={material} attach="material" />
}
