import * as React from 'react'
import * as THREE from 'three'
import { extend, useFrame } from 'react-three-fiber'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { shaderMaterial, useTessellation, Octahedron } from '../../src'

export default {
  title: 'Modifiers/useTessellation',
  component: useTessellation,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

const VertexDisplaceMaterial = shaderMaterial(
  {
    amplitude: 1,
  },
  `
  uniform float amplitude;

  attribute vec3 customColor;
  attribute vec3 displacement;

  varying vec3 vNormal;
  varying vec3 vColor;

  void main() {

    vNormal = normal;
    vColor = customColor;

    vec3 newPosition = position + normal * amplitude * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

  }
`,
  `
varying vec3 vNormal;

void main() {
  gl_FragColor = vec4(vNormal.xy, 1., 1.0 );
}
`
)

extend({ VertexDisplaceMaterial })

type VertexDisplaceMaterialImpl = {
  amplitude?: number
} & JSX.IntrinsicElements['shaderMaterial']

declare global {
  namespace JSX {
    interface IntrinsicElements {
      vertexDisplaceMaterial: VertexDisplaceMaterialImpl
    }
  }
}

function UseTessellationScene() {
  const passes = number('passes', 3)
  const maxEdgeLength = number('maxEdgeLength', 3)
  const meshRef = useTessellation(passes, maxEdgeLength)

  React.useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry as THREE.BufferGeometry

      const numFaces = geometry.attributes.position.count / 3

      var displacement = new Float32Array(numFaces * 3 * 3)

      for (var f = 0; f < numFaces; f++) {
        var index = 9 * f
        var d = 10 * (0.5 - Math.random())

        for (var i = 0; i < 3; i++) {
          displacement[index + 3 * i] = d
          displacement[index + 3 * i + 1] = d
          displacement[index + 3 * i + 2] = d
        }
      }

      geometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 3))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(({ clock }) => {
    const { current: mesh } = meshRef
    if (mesh) {
      const { material } = mesh
      ;(material as THREE.ShaderMaterial).uniforms.amplitude.value = (1.0 + Math.sin(clock.getElapsedTime())) * 0.1
    }
  })

  return (
    <Octahedron args={[3, 1]} ref={meshRef}>
      <vertexDisplaceMaterial attach="material" flatShading side={THREE.DoubleSide} />
    </Octahedron>
  )
}

export const UseTessellationSceneSt = () => <UseTessellationScene />
UseTessellationSceneSt.story = {
  name: 'Default',
}
