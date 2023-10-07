import * as THREE from 'three'
import * as React from 'react'
import { shaderMaterial } from './shaderMaterial'
import { extend, applyProps, ReactThreeFiber, useThree } from '@react-three/fiber'
import { toCreasedNormals } from 'three-stdlib'

const OutlinesMaterial = shaderMaterial(
  { screenspace: false, color: new THREE.Color('black'), opacity: 1, thickness: 0.05, size: new THREE.Vector2() },
  `#include <common>
   #include <morphtarget_pars_vertex>
   #include <skinning_pars_vertex>
   uniform float thickness;
   uniform float screenspace;
   uniform vec2 size;
   void main() {
     #if defined (USE_SKINNING)
	     #include <beginnormal_vertex>
       #include <morphnormal_vertex>
       #include <skinbase_vertex>
       #include <skinnormal_vertex>
       #include <defaultnormal_vertex>
     #endif
     #include <begin_vertex>
	   #include <morphtarget_vertex>
	   #include <skinning_vertex>
     #include <project_vertex>
     vec4 tNormal = vec4(normal, 0.0);
     vec4 tPosition = vec4(transformed, 1.0);
     #ifdef USE_INSTANCING
       tNormal = instanceMatrix * tNormal;
       tPosition = instanceMatrix * tPosition;
     #endif
     if (screenspace == 0.0) {
       vec3 newPosition = tPosition.xyz + tNormal.xyz * thickness;
       gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0); 
     } else {
       vec4 clipPosition = projectionMatrix * modelViewMatrix * tPosition;
       vec4 clipNormal = projectionMatrix * modelViewMatrix * tNormal;
       vec2 offset = normalize(clipNormal.xy) * thickness / size * clipPosition.w * 2.0;
       clipPosition.xy += offset;
       gl_Position = clipPosition;
     }
   }`,
  `uniform vec3 color;
   uniform float opacity;
   void main(){
     gl_FragColor = vec4(color, opacity);
     #include <tonemapping_fragment>
     #include <${parseInt(THREE.REVISION.replace(/\D+/g, '')) >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
   }`
)

type OutlinesProps = JSX.IntrinsicElements['group'] & {
  /** Outline color, default: black */
  color: ReactThreeFiber.Color
  /** Line thickness is independent of zoom, default: false */
  screenspace: boolean
  /** Outline opacity, default: 1 */
  opacity: number
  /** Outline transparency, default: false */
  transparent: boolean
  /** Outline thickness, default 0.05 */
  thickness: number
  /** Geometry crease angle (0 === no crease), default: Math.PI */
  angle: number
  toneMapped?: boolean
  polygonOffset?: boolean
  polygonOffsetFactor?: number
  renderOrder?: number
}

export function Outlines({
  color = 'black',
  opacity = 1,
  transparent = false,
  screenspace = false,
  toneMapped = true,
  polygonOffset = false,
  polygonOffsetFactor = 0,
  renderOrder = 0,
  thickness = 0.05,
  angle = Math.PI,
  ...props
}: OutlinesProps) {
  const ref = React.useRef<THREE.Group>(null!)
  const [material] = React.useState(() => new OutlinesMaterial({ side: THREE.BackSide }))
  const { gl } = useThree()
  const contextSize = gl.getDrawingBufferSize(new THREE.Vector2())
  React.useMemo(() => extend({ OutlinesMaterial }), [])
  React.useLayoutEffect(() => {
    const group = ref.current
    const parent = group.parent as THREE.Mesh & THREE.SkinnedMesh & THREE.InstancedMesh
    if (parent && parent.geometry) {
      let mesh
      if (parent.skeleton) {
        mesh = new THREE.SkinnedMesh()
        mesh.material = material
        mesh.bind(parent.skeleton, parent.bindMatrix)
        group.add(mesh)
      } else if (parent.isInstancedMesh) {
        mesh = new THREE.InstancedMesh(parent.geometry, material, parent.count)
        mesh.instanceMatrix = parent.instanceMatrix
        group.add(mesh)
      } else {
        mesh = new THREE.Mesh()
        mesh.material = material
        group.add(mesh)
      }
      mesh.geometry = angle ? toCreasedNormals(parent.geometry, angle) : parent.geometry
      return () => {
        if (angle) mesh.geometry.dispose()
        group.remove(mesh)
      }
    }
  }, [angle, (ref.current as any)?.parent?.geometry])

  React.useLayoutEffect(() => {
    const group = ref.current
    const mesh = group.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
    if (mesh) {
      mesh.renderOrder = renderOrder
      applyProps(mesh.material as any, {
        transparent,
        thickness,
        color,
        opacity,
        size: contextSize,
        screenspace,
        toneMapped,
        polygonOffset,
        polygonOffsetFactor,
      })
    }
  }, [
    angle,
    transparent,
    thickness,
    color,
    opacity,
    screenspace,
    toneMapped,
    polygonOffset,
    polygonOffsetFactor,
    contextSize,
    renderOrder,
  ])

  return <group ref={ref} {...props} />
}
