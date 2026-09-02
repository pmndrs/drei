import * as React from 'react'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { MeshDiscardMaterial } from './MeshDiscardMaterial'

export default {
  title: 'Shaders/MeshDiscardMaterial (WebGPU)',
  component: MeshDiscardMaterial,
  // This is the src/webgpu implementation, so it cannot run on the WebGL
  // renderer — pin it rather than letting the toolbar toggle break it.
  decorators: [
    (Story, context) => (
      // `limitedTo` is what actually pins the renderer — Setup computes
      // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
      // so this stays on WebGPU whatever the toolbar says.
      <Setup
        renderer={context.globals.renderer}
        limitedTo="webgpu"
        cameraPosition={new Vector3(0, 2.5, 7)}
        lights={false}
        floor={false}
      >
        <Story />
      </Setup>
    ),
  ],
  // 'parity' opts into test/parity — see the note on MeshDiscardScene below for
  // what that comparison can and cannot tell you while `limitedTo` is set.
  tags: ['webgpuOnly', 'parity'],
} satisfies Meta<typeof MeshDiscardMaterial>

type Story = StoryObj<typeof MeshDiscardMaterial>

/**
 * A discard material draws nothing, so the story has to show it *doing*
 * something. Two identical torus knots sit side by side: the left one has a
 * standard material, the right one has `<MeshDiscardMaterial />`. The right
 * knot is invisible, yet it still casts the same shadow (the WebGPU shadow pass
 * swaps in `scene.overrideMaterial`, so the mesh's own fragment node never runs
 * there) and its child sphere still renders.
 *
 * Primitives rather than a GLTF: if this renders nothing, the cause should be
 * the component and not an asset that failed to load.
 *
 * Note on the 'parity' tag: the harness loads this story once per renderer
 * global, but `limitedTo="webgpu"` pins both passes to WebGPU, so the diff is
 * WebGPU against itself. It guards against non-determinism, not against
 * WebGL/WebGPU drift — there is no core/legacy story at this id to compare to.
 */
function MeshDiscardScene(props: React.ComponentProps<typeof MeshDiscardMaterial>) {
  return (
    <>
      <color attach="background" args={['#151a24']} />

      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[4, 8, 4]}
        intensity={2.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Reference: same geometry, ordinary material. */}
      <mesh castShadow position={[-1.9, 0, 0]}>
        <torusKnotGeometry args={[0.6, 0.22, 128, 32]} />
        <meshStandardMaterial color="orange" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Subject: identical mesh, discarded. Invisible, still casts a shadow. */}
      <mesh castShadow position={[1.9, 0, 0]}>
        <torusKnotGeometry args={[0.6, 0.22, 128, 32]} />
        <MeshDiscardMaterial {...props} />

        {/* Children of a discarded mesh still render. */}
        <mesh castShadow>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={0.4} />
        </mesh>
      </mesh>

      {/* Shadow catcher — Setup's own ground does not receive shadows. */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.99, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2f3a" />
      </mesh>
    </>
  )
}

export const MeshDiscardMaterialSt = {
  name: 'Default',
  render: (args) => <MeshDiscardScene {...args} />,
  args: {},
} satisfies Story
