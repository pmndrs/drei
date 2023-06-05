import * as THREE from 'three'
import * as React from 'react'
import { ReactThreeFiber, extend, useFrame, useThree } from '@react-three/fiber'
import { RenderTexture } from './RenderTexture'
import { shaderMaterial } from './shaderMaterial'

// Author: N8, https://twitter.com/N8Programs
const PortalMaterial = shaderMaterial(
  {
    blur: 0.0,
    map: null,
    resolution: new THREE.Vector2(),
  },
  `varying vec2 vUv;
   void main() {
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
     vUv = uv;
   }`,
  `varying vec2 vUv;
   uniform float blur;
   uniform sampler2D map;
   uniform vec2 resolution;
   float blurCircle(vec2 center, vec2 uv, float k) {
     float sdf = distance(uv, center) - 0.5;
     float norm = sdf / 0.5;
     return 1.0 - smoothstep(0.0, 1.0, clamp((1.0/k)*norm + 1.0, 0.0, 1.0));
   }
   void main() {
     vec2 uv = gl_FragCoord.xy / resolution.xy;
     vec4 t = texture2D(map, uv);
     float strength = blurCircle(vec2(0.5), vUv, blur);
     gl_FragColor = vec4(t.rgb, t.a * strength);
     #include <tonemapping_fragment>
     #include <encodings_fragment>
   }`
)

declare global {
  namespace JSX {
    interface IntrinsicElements {
      portalMaterial: ReactThreeFiber.ShaderMaterialProps & { resolution: ReactThreeFiber.Vector2; blur: number }
    }
  }
}

export type PortalProps = JSX.IntrinsicElements['mesh'] & { blur?: number }

export const MeshPortalMaterial = React.forwardRef(
  ({ children, ...props }: PortalProps, fref: React.ForwardedRef<typeof PortalMaterial>) => {
    extend({ PortalMaterial })
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
      <portalMaterial
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
      </portalMaterial>
    )
  }
)
