import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'
import { useGLTF, Environment, OrbitControls } from 'drei'
import { Caustics, CausticsProps } from './Caustics'
import { Caustics as CausticsWebGPU } from '../../../webgpu/Effects/Caustics/Caustics'

export default {
  title: 'Shaders/Caustics',
  component: Caustics,
  tags: ['dual'],
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        lights={false}
        cameraFov={45}
        cameraPosition={new THREE.Vector3(-5, 5, 5)}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Caustics>

type Story = StoryObj<typeof Caustics>

function BunnyMesh({ ior }: { ior?: number }) {
  const { nodes } = useGLTF('/models/bunny-transformed.glb') as any
  const bunnyMesh = Object.values(nodes).find((n: any) => n?.isMesh) as THREE.Mesh

  // Offset so the bottom of the scaled bunny sits at y=0 in Caustics local space
  const yOffset = React.useMemo(() => {
    bunnyMesh.geometry.computeBoundingBox()
    return -(bunnyMesh.geometry.boundingBox!.min.y * 0.01)
  }, [bunnyMesh])

  return (
    <mesh castShadow scale={0.01} position={[0, yOffset, 0]} receiveShadow geometry={bunnyMesh.geometry} dispose={null}>
      <meshPhysicalMaterial
        transmission={1}
        roughness={0}
        thickness={3.5}
        ior={ior ?? 1.1}
        color="white"
        attenuationColor="white"
        attenuationDistance={0.5}
      />
    </mesh>
  )
}

function CausticsScene(props: Omit<CausticsProps, 'ref'>) {
  const { ior, ...causticsProps } = props
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={Math.PI} castShadow />
      <ambientLight intensity={0.5 * Math.PI} />

      <PlatformSwitch
        legacy={
          <Caustics position={[0, -0.5, 0]} lightSource={[5, 5, 5]} ior={ior} {...causticsProps}>
            <BunnyMesh ior={ior} />
          </Caustics>
        }
        webgpu={
          <CausticsWebGPU position={[0, -0.5, 0]} lightSource={[5, 5, 5]} ior={ior} {...causticsProps}>
            <BunnyMesh ior={ior} />
          </CausticsWebGPU>
        }
      />

      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr" />
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.1} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
    </>
  )
}

export const CausticsSt = {
  args: {
    backside: true,
    ior: 1.1,
    backsideIOR: 1.1,
    worldRadius: 0.3125,
    intensity: 0.05,
    color: 'white',
    debug: false,
    causticsOnly: false,
    resolution: 2048,
  },
  argTypes: {
    color: { control: 'color' },
    ior: { control: { type: 'range', min: 1.0, max: 2.5, step: 0.01 } },
    backsideIOR: { control: { type: 'range', min: 1.0, max: 2.5, step: 0.01 } },
    worldRadius: { control: { type: 'range', min: 0.01, max: 1.0, step: 0.01 } },
    intensity: { control: { type: 'range', min: 0.0, max: 1.0, step: 0.005 } },
    resolution: { control: { type: 'select' }, options: [256, 512, 1024, 2048] },
  },
  render: (args) => <CausticsScene {...args} />,
  name: 'Default',
} satisfies Story
