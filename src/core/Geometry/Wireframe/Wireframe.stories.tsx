import * as React from 'react'
import { IcosahedronGeometry, Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Environment, Wireframe } from 'drei'

export default {
  title: 'Staging/Wireframe',
  component: Wireframe,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(2, 2, 2)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Wireframe>

type Story = StoryObj<typeof Wireframe>

function WireframeScene(props: React.ComponentProps<typeof Wireframe>) {
  const geom = React.useMemo(() => new IcosahedronGeometry(1, 16), [])

  return (
    <>
      <mesh>
        <icosahedronGeometry args={[1, 16]} />
        <meshPhysicalMaterial color="red" roughness={0.2} metalness={1} />

        <Wireframe {...props} />
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
    </>
  )
}

export const WireframeSt = {
  args: {
    stroke: 'white',
    squeeze: true,
    dash: true,
  },
  argTypes: {
    stroke: { control: 'color' },
  },
  render: (args) => <WireframeScene {...args} />,
  name: 'Default',
} satisfies Story
