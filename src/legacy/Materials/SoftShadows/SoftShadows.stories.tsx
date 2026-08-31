import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'
import { useFrame } from '@react-three/fiber'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'
import { SoftShadows } from './SoftShadows'
import { SoftShadows as SoftShadowsWebGPU } from '../../../webgpu/Staging/SoftShadows'

export default {
  title: 'Staging/SoftShadows',
  tags: ['dual'],
  component: SoftShadows,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        cameraPosition={new THREE.Vector3(-5, 2, 10)}
        cameraFov={60}
        controls
        lights={false}
        floor={false}
        shadows={'basic'}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof SoftShadows>

type Story = StoryObj<typeof SoftShadows>

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1)

function Sphere({ position = [0, 0, 0] as [number, number, number], ...props }) {
  const ref = React.useRef<THREE.Mesh>(null!)
  const factor = React.useMemo(() => 0.5 + Math.random(), [])

  useFrame((state) => {
    const t = easeInOutCubic((1 + Math.sin(state.elapsed * factor)) / 2)
    ref.current.position.y = position[1] + t * 4
    ref.current.scale.y = 1 + t * 3
  })

  return (
    <mesh ref={ref} position={position} {...props} castShadow receiveShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshLambertMaterial color="white" />
    </mesh>
  )
}

function Spheres({ number = 20 }) {
  const ref = React.useRef<THREE.Group>(null!)
  const positions = React.useMemo(
    () =>
      [...new Array(number)].map(
        () => [3 - Math.random() * 6, Math.random() * 4, 3 - Math.random() * 6] as [number, number, number]
      ),
    [number]
  )

  useFrame((state) => {
    ref.current.rotation.y = Math.sin(state.elapsed / 2) * Math.PI
  })

  return (
    <group ref={ref}>
      {positions.map((pos, index) => (
        <Sphere key={index} position={pos} />
      ))}
    </group>
  )
}

function SoftShadowsScene({
  Component,
  ...props
}: { Component: typeof SoftShadows } & React.ComponentProps<typeof SoftShadows>) {
  return (
    <group position={[0, 2.5, 0]}>
      <Component {...props} />
      <fog attach="fog" args={['white', 0, 40]} />
      <ambientLight intensity={0.5} />
      <directionalLight castShadow position={[2.5, 8, 5]} intensity={1.5} shadow-mapSize={1024}>
        <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
      </directionalLight>
      <pointLight position={[-10, 0, -20]} color="white" intensity={1} />
      <pointLight position={[0, -10, 0]} intensity={1} />
      <group position={[0, -3.5, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4, 1, 1]} />
          <meshLambertMaterial />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#B99A9A" opacity={0.4} />
        </mesh>
        <Spheres />
      </group>
    </group>
  )
}

export const SoftShadowsSt = {
  args: {
    size: 25,
    focus: 0,
    samples: 10,
  },
  argTypes: {
    size: { control: { type: 'range', min: 0, max: 100 } },
    focus: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    samples: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
  render: (args) => (
    <PlatformSwitch
      legacy={<SoftShadowsScene Component={SoftShadows} {...args} />}
      webgpu={<SoftShadowsScene Component={SoftShadowsWebGPU as typeof SoftShadows} {...args} />}
    />
  ),
  name: 'Default',
} satisfies Story
