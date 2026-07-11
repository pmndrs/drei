import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import type { Mesh } from 'three'
import { Vector3 } from 'three/webgpu'

import { Setup } from '@sb/Setup'

import { Inspector, useInspectorControls } from './index'

export default {
  title: 'Performance/Inspector',
  component: Inspector,
  tags: ['webgpuOnly'],
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        cameraPosition={new Vector3(0, 1.5, 5)}
        controls={false}
        lights={false}
        floor={false}
        limitedTo={context.parameters.limitedTo ?? 'webgpu'}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Inspector>

type Story = StoryObj<typeof Inspector>

function InspectorScene() {
  const meshRef = React.useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * 0.45
    meshRef.current.rotation.y += delta * 0.9
  })

  return (
    <Inspector>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ff8c42" />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, -1.25, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#101014" roughness={1} metalness={0} />
      </mesh>

      <pointLight position={[2, 3, 2]} intensity={10} color="#ff8c42" />
      <axesHelper args={[2]} />
    </Inspector>
  )
}

function UseInspectorControlsContent() {
  const meshRef = React.useRef<Mesh>(null)

  const { spin, color, wireframe, lightIntensity } = useInspectorControls(
    {
      spin: { value: 1, min: 0, max: 4, step: 0.1, label: 'Spin Speed' },
      color: { value: '#ff8c42', color: true, label: 'Cube Color' },
      wireframe: { value: false },
      lightIntensity: { value: 10, min: 0, max: 50, step: 1, label: 'Light' },
    },
    { title: 'Inspector Controls' }
  )

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * spin * 0.5
    meshRef.current.rotation.y += delta * spin
  })

  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={color} wireframe={wireframe} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, -1.25, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#101014" roughness={1} metalness={0} />
      </mesh>

      <pointLight position={[2, 3, 2]} intensity={lightIntensity} color={color} />
      <axesHelper args={[2]} />
    </>
  )
}

function UseInspectorControlsScene() {
  return (
    <Inspector>
      <UseInspectorControlsContent />
    </Inspector>
  )
}

export const InspectorSt = {
  render: () => <InspectorScene />,
  name: 'Inspector',
  parameters: {
    limitedTo: 'webgpu',
  },
} satisfies Story

export const UseInspectorControlsSt = {
  render: () => <UseInspectorControlsScene />,
  name: 'useInspectorControls',
  parameters: {
    limitedTo: 'webgpu',
  },
} satisfies Story
