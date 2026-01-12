import * as React from 'react'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { RenderTexture, OrbitControls, PerspectiveCamera } from 'drei'

export default {
  title: 'Portals/RenderTexture',
  component: RenderTexture,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)} controls={false} lights={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof RenderTexture>

type Story = StoryObj<typeof RenderTexture>

//* Helper Components ==============================

// Dodecahedron with hover/click interaction ---------------------------------
function Dodecahedron(props: ThreeElements['group']) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01
    }
  })

  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        scale={clicked ? 1.5 : 1}
        onClick={() => click(!clicked)}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}
      >
        <dodecahedronGeometry args={[0.75]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : '#5de4c7'} />
      </mesh>
    </group>
  )
}

// Cube with RenderTexture as its map ---------------------------------
function Cube() {
  return (
    <mesh>
      <boxGeometry />
      <meshStandardMaterial>
        <RenderTexture attach="map" anisotropy={16}>
          <PerspectiveCamera makeDefault manual aspect={1 / 1} position={[0, 0, 5]} />
          <color attach="background" args={['orange']} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} />

          <Dodecahedron />
        </RenderTexture>
      </meshStandardMaterial>
    </mesh>
  )
}

//* RenderTexture Scene ==============================

function RenderTextureScene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={5} />

      <Cube />
      <Dodecahedron position={[0, 1, 0]} scale={0.2} />
      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

//* Stories ==============================

export const RenderTextureSt = {
  render: () => <RenderTextureScene />,
  name: 'Default',
} satisfies Story
