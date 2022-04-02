import * as React from 'react'
import { extend } from '@react-three/fiber'
import { Texture } from 'three'

import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import { Box, MeshDistortMaterial, shaderMaterial, useTexture } from '../../src'

export default {
  title: 'Shaders/shaderMaterial',
  component: MeshDistortMaterial,
  decorators: [withKnobs, (storyFn) => <Setup> {storyFn()}</Setup>],
}

const MyMaterial = shaderMaterial(
  { map: new Texture(), repeats: 1 },
  `
varying vec2 vUv;

void main()	{
  vUv = uv;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`,
  `
varying vec2 vUv;
uniform float repeats;
uniform sampler2D map;

float random (vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main(){
  vec2 uv = vUv;

  uv *= repeats;
  uv = fract(uv);

  vec3 color = vec3(
    texture2D(map, uv).r,
    texture2D(map, uv + vec2(0.01,0.01)).g,
    texture2D(map, uv - vec2(0.01,0.01)).b
  );
  
  gl_FragColor = vec4(color,1.0);

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}
`
)

extend({ MyMaterial })

type MyMaterialImpl = {
  repeats: number
  map: Texture | Texture[]
} & JSX.IntrinsicElements['shaderMaterial']

declare global {
  namespace JSX {
    interface IntrinsicElements {
      myMaterial: MyMaterialImpl
    }
  }
}

function ShaderMaterialScene() {
  const map = useTexture(`https://source.unsplash.com/random/400x400`)

  return (
    <Box args={[5, 5, 5]}>
      <myMaterial repeats={number('repeats', 2, { range: true, min: 1, max: 10, step: 1 })} map={map} />
    </Box>
  )
}

export const ShaderMaterialStory = () => (
  <React.Suspense fallback={null}>
    <ShaderMaterialScene />
  </React.Suspense>
)
ShaderMaterialStory.storyName = 'Default'
