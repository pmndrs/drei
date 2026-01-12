import * as React from 'react'
import { useRef } from 'react'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Hud, OrbitControls, PerspectiveCamera } from 'drei'
import { Text } from '../../../legacy/UI/Text/Text'

export default {
  title: 'Portals/Hud',
  component: Hud,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Hud>

type Story = StoryObj<typeof Hud>

//* Helper Components ==============================

// Spinning Box in the main scene ---------------------------------
function SpinningBox() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  )
}

// Crosshair HUD element ---------------------------------
function Crosshair() {
  return (
    <group>
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[0.8, 0.85, 64]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
      </mesh>

      {/* Inner ring */}
      <mesh>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.8} />
      </mesh>

      {/* Crosshair lines */}
      <mesh position={[0, 0.5, 0]}>
        <planeGeometry args={[0.05, 0.3]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <planeGeometry args={[0.05, 0.3]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0.5, 0, 0]}>
        <planeGeometry args={[0.3, 0.05]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-0.5, 0, 0]}>
        <planeGeometry args={[0.3, 0.05]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// Corner bracket HUD element ---------------------------------
function CornerBrackets() {
  const size = 0.15
  const offset = 1.2

  const Bracket = ({ position, rotation }: { position: [number, number, number]; rotation: number }) => (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh position={[size / 2, 0, 0]}>
        <planeGeometry args={[size, 0.02]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
      <mesh position={[0, size / 2, 0]}>
        <planeGeometry args={[0.02, size]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    </group>
  )

  return (
    <group>
      <Bracket position={[-offset, offset, 0]} rotation={0} />
      <Bracket position={[offset, offset, 0]} rotation={Math.PI / 2} />
      <Bracket position={[offset, -offset, 0]} rotation={Math.PI} />
      <Bracket position={[-offset, -offset, 0]} rotation={-Math.PI / 2} />
    </group>
  )
}

//* Hud Scene ==============================

function HudScene(props: React.ComponentProps<typeof Hud>) {
  return (
    <>
      {/* Main scene content */}
      <OrbitControls makeDefault />
      <SpinningBox />

      {/* HUD overlay - isolated scene rendered on top */}
      <Hud {...props}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <Crosshair />
        <CornerBrackets />

        {/* Status text */}
        <Text position={[0, -1.5, 0]} fontSize={0.12} color="#00ff88" anchorX="center" anchorY="middle">
          HUD OVERLAY - ISOLATED SCENE
        </Text>
      </Hud>
    </>
  )
}

//* Stories ==============================

export const HudSt = {
  args: {
    renderPriority: 1,
  },
  argTypes: {
    renderPriority: { control: { type: 'range', min: 1, max: 10, step: 1 } },
  },
  render: (args) => <HudScene {...args} />,
  name: 'Default',
} satisfies Story
