import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import {
  Circle,
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Plane,
  SpotLight,
  SpotLightShadow,
  useDepthBuffer,
  useTexture,
} from '../../src'
import { MathUtils, RepeatWrapping } from 'three'

export default {
  title: 'Staging/Spotlight',
  component: SpotLight,
  decorators: [withKnobs, (storyFn) => <Setup lights={false}> {storyFn()}</Setup>],
}

function SpotLightScene() {
  const depthBuffer = useDepthBuffer({ size: number('size', 256) })

  return (
    <>
      <SpotLight
        penumbra={0.5}
        depthBuffer={depthBuffer}
        position={[3, 2, 0]}
        intensity={0.5}
        angle={0.5}
        color="#ff005b"
        castShadow
      />
      <SpotLight
        penumbra={0.5}
        depthBuffer={depthBuffer}
        position={[-3, 2, 0]}
        intensity={0.5}
        angle={0.5}
        color="#0EEC82"
        castShadow
      />

      <mesh position-y={0.5} castShadow>
        <boxGeometry />
        <meshPhongMaterial />
      </mesh>

      <Plane receiveShadow rotation-x={-Math.PI / 2} args={[100, 100]}>
        <meshPhongMaterial />
      </Plane>
    </>
  )
}

export const SpotlightSt = () => <SpotLightScene />
SpotlightSt.storyName = 'Default'

function SpotLightShadowsScene({ debug, wind }: { debug: boolean; wind: boolean }) {
  const [diffuse, normal, roughness, ao] = useTexture(
    [
      '/textures/grassy_cobble/grassy_cobblestone_diff_2k.jpg',
      '/textures/grassy_cobble/grassy_cobblestone_nor_gl_2k.jpg', //
      '/textures/grassy_cobble/grassy_cobblestone_rough_2k.jpg',
      '/textures/grassy_cobble/grassy_cobblestone_ao_2k.jpg',
    ],
    (texs: any) => {
      for (const tex of texs) {
        tex.wrapS = tex.wrapT = RepeatWrapping
        tex.repeat.set(2, 2)
      }
    }
  )
  const leafTexture = useTexture('/textures/other/leaves.jpg')

  return (
    <>
      <OrbitControls
        makeDefault //
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={2}
        maxDistance={10}
      />
      <PerspectiveCamera
        near={0.01} //
        far={50}
        position={[1, 3, 1]}
        makeDefault
        fov={60}
      />

      <Environment preset="sunset" />

      <hemisphereLight args={[0xffffbb, 0x080820, 1]} />

      <Circle receiveShadow args={[5, 64, 64]} rotation-x={-Math.PI / 2}>
        <meshStandardMaterial
          map={diffuse} //
          normalMap={normal}
          roughnessMap={roughness}
          aoMap={ao}
          envMapIntensity={0.2}
        />
      </Circle>

      <SpotLight
        distance={20}
        intensity={5}
        angle={MathUtils.degToRad(45)}
        color={'#fadcb9'}
        position={[5, 7, -2]}
        volumetric={false}
        debug={debug}
      >
        <SpotLightShadow
          scale={4}
          distance={0.4}
          width={2048}
          height={2048}
          map={leafTexture}
          shader={
            wind
              ? /* glsl */ `
            varying vec2 vUv;

            uniform sampler2D uShadowMap;
            uniform float uTime;

            void main() {
              // material.repeat.set(2.5) - Since repeat is a shader feature not texture
              // we need to implement it manually
              vec2 uv = mod(vUv, 0.4) * 2.5;

              // Fake wind distortion
              uv.x += sin(uv.y * 10.0 + uTime * 0.5) * 0.02;
              uv.y += sin(uv.x * 10.0 + uTime * 0.5) * 0.02;

              vec3 color = texture2D(uShadowMap, uv).xyz;
              gl_FragColor = vec4(color, 1.);
            }
          `
              : undefined
          }
        />
      </SpotLight>
    </>
  )
}

export const SpotlightShadowsSt = (props) => (
  <React.Suspense fallback={null}>
    <SpotLightShadowsScene {...props} />
  </React.Suspense>
)
SpotlightShadowsSt.storyName = 'Shadows'

SpotlightShadowsSt.args = {
  debug: false,
  wind: true,
}

SpotlightShadowsSt.argTypes = {}
