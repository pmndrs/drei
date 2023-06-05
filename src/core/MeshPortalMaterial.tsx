import * as THREE from 'three'
import * as React from 'react'
import { ReactThreeFiber, extend, useFrame, useThree } from '@react-three/fiber'
import { RenderTexture } from './RenderTexture'
import { shaderMaterial } from './shaderMaterial'

// Author: N8, https://twitter.com/N8Programs
const PortalMaterial = shaderMaterial(
  {
    map: null,
    resolution: new THREE.Vector2(),
  },
  `void main() {
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `uniform sampler2D map;
   uniform vec2 resolution;
   void main() {
     vec2 uv = gl_FragCoord.xy / resolution.xy;
     vec4 t = texture2D(map, uv);
     gl_FragColor = texture2D(map, uv);
     #include <tonemapping_fragment>
     #include <encodings_fragment>
   }`
)

declare global {
  namespace JSX {
    interface IntrinsicElements {
      drei_PortalMaterial: ReactThreeFiber.ShaderMaterialProps & { resolution: ReactThreeFiber.Vector2 }
    }
  }
}

export type PortalProps = JSX.IntrinsicElements['mesh'] & { shader?: string | any }

export const MeshPortalMaterial = React.forwardRef(
  (
    { children, shader: Shader = 'drei_PortalMaterial', ...props }: PortalProps,
    fref: React.ForwardedRef<typeof PortalMaterial>
  ) => {
    extend({ drei_PortalMaterial: PortalMaterial })
    const ref = React.useRef<typeof PortalMaterial>(null!)
    const group = React.useRef<THREE.Group>(null!)
    const { size, events, viewport } = useThree()
    useFrame(() => {
      let parent = (ref.current as any)?.__r3f.parent
      if (parent) {
        group.current.matrix.copy(parent.matrixWorld)
      }
    })
    React.useImperativeHandle(fref, () => ref.current)
    return (
      <Shader
        // @ts-ignore
        ref={ref}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        toneMapped={false}
        {...props}
      >
        <RenderTexture attach="map" compute={events.compute as any}>
          <group onPointerOver={() => null} matrixAutoUpdate={false} ref={group}>
            {children}
          </group>
        </RenderTexture>
      </Shader>
    )
  }
)
