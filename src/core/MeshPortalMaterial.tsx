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
   void main() {
     vec2 uv = gl_FragCoord.xy / resolution.xy;
     float strength = 1.0 - distance(vUv, vec2(0.5)) * 2.0 * blur;
     gl_FragColor = vec4(texture2D(map, uv).rgb, strength);
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
