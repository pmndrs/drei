import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { IcosahedronGeometry, SphereGeometry, Vector3 } from 'three'

import { Setup } from '../Setup'
import { Environment, Wireframe } from '../../src'

export default {
  title: 'Staging/Wireframe',
  component: Wireframe,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(2, 2, 2)}>{storyFn()}</Setup>],
}

function WireframeScene() {
  const geom = React.useMemo(() => new IcosahedronGeometry(1, 16), [])

  return (
    <>
      <React.Suspense fallback={null}>
        <mesh>
          <icosahedronGeometry args={[1, 16]} />
          <meshPhysicalMaterial color="red" roughness={0.2} metalness={1} />

          <Wireframe stroke="white" squeeze dash />
        </mesh>

        <mesh position={[0, 0, -2.5]}>
          <torusKnotGeometry />
          <meshBasicMaterial color="red" />

          <Wireframe simplify stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
        </mesh>

        <group position={[-2.5, 0, -2.5]}>
          <Wireframe fill="blue" geometry={geom} stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
        </group>

        <mesh position={[-2.5, 0, 0]}>
          <sphereGeometry args={[1, 16, 16]} />
          <shaderMaterial
            vertexShader={
              /* glsl */ `
            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `
            }
            fragmentShader={
              /* glsl */ `
          
            void main() {
              float edge = getWireframe();
              gl_FragColor = vec4(1.0, 1.0, 0.0, edge);
            }
          `
            }
          />

          <Wireframe stroke="white" squeeze dash />
        </mesh>

        <Environment background preset="sunset" blur={0.2} />
      </React.Suspense>
    </>
  )
}

export const WireframeSt = () => <WireframeScene />
WireframeSt.storyName = 'Default'
