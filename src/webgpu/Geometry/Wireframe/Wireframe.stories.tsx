import * as React from 'react'
import { IcosahedronGeometry, Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Wireframe } from './Wireframe'

export default {
  title: 'Geometry/Wireframe (WebGPU)',
  component: Wireframe,
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(2, 2, 4)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof Wireframe>

type Story = StoryObj<typeof Wireframe>

/**
 * Mirrors the pre-v11 story minus its GLSL `shaderMaterial` case, which is
 * WebGL-only. Covers both code paths: Wireframe as a child of a mesh (it
 * rewrites the parent geometry) and Wireframe with an explicit `geometry` prop.
 */
function WireframeScene(props: React.ComponentProps<typeof Wireframe>) {
  const geom = React.useMemo(() => new IcosahedronGeometry(1, 4), [])

  React.useEffect(() => () => geom.dispose(), [geom])

  return (
    <>
      {/* Child-of-mesh path */}
      <mesh>
        <icosahedronGeometry args={[1, 4]} />
        <meshPhysicalMaterial color="red" roughness={0.2} metalness={1} />

        <Wireframe {...props} />
      </mesh>

      {/* Child-of-mesh path, different geometry */}
      <mesh position={[0, 0, -2.5]}>
        <torusKnotGeometry />
        <meshBasicMaterial color="red" />

        <Wireframe simplify stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
      </mesh>

      {/* Explicit geometry prop path */}
      <group position={[-2.5, 0, -2.5]}>
        <Wireframe fill="blue" geometry={geom} stroke="white" squeeze dash fillMix={1} fillOpacity={0.2} />
      </group>
    </>
  )
}

export const WireframeSt = {
  name: 'Default',
  render: (args) => <WireframeScene {...args} />,
  args: {
    stroke: 'white',
    squeeze: true,
    dash: true,
  },
  argTypes: {
    stroke: { control: 'color' },
  },
} satisfies Story
