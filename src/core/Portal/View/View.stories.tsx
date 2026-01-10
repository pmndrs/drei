import * as React from 'react'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { View, OrbitControls, PerspectiveCamera, OrthographicCamera, Environment, useGLTF } from 'drei'

export default {
  title: 'Portals/View',
  component: View,
  // Note: View requires special setup - cannot use standard Setup decorator
  // because it needs HTML containers outside the Canvas with eventSource binding
} satisfies Meta<typeof View>

type Story = StoryObj<typeof View>

//* Helper Components ==============================

// Hover hook for interactive elements ---------------------------------
function useHover() {
  const [hovered, hover] = useState(false)
  return [hovered, { onPointerOver: () => hover(true), onPointerOut: () => hover(false) }] as const
}

// Simple colored box with hover effect ---------------------------------
function HoverBox({ color = 'royalblue', ...props }: { color?: string } & React.JSX.IntrinsicElements['mesh']) {
  const [hovered, spread] = useHover()
  return (
    <mesh {...props} {...spread}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : color} />
    </mesh>
  )
}

// Parrot model from Three.js examples ---------------------------------
function Parrot(props: React.JSX.IntrinsicElements['group']) {
  const [hovered, spread] = useHover()
  const { scene } = useGLTF('https://threejs.org/examples/models/gltf/Parrot.glb')

  return (
    <group {...props} {...spread} dispose={null}>
      <primitive object={scene.clone()}>
        <meshStandardMaterial color={hovered ? 'red' : 'green'} roughness={0} metalness={0.8} />
      </primitive>
    </group>
  )
}

// Environment lighting helper ---------------------------------
function Lights({ preset }: { preset: React.ComponentProps<typeof Environment>['preset'] }) {
  return (
    <>
      <ambientLight intensity={1} />
      <pointLight position={[20, 30, 10]} />
      <pointLight position={[-10, -10, -10]} color="blue" />
      <Environment preset={preset} />
    </>
  )
}

//* View Demo ==============================
// The View component allows rendering different scenes in separate HTML containers
// while sharing a single WebGL context. Each View can have its own camera,
// controls, and content.

function ViewDemo() {
  const containerRef = useRef<HTMLDivElement>(null!)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '500px' }}>
      {/* Views as HTML containers - these track their position and render to that region */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%', height: '100%' }}>
        {/* View 1: Yellow background with perspective camera */}
        <View index={1} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
          <color attach="background" args={['#fed200']} />
          <PerspectiveCamera makeDefault position={[0, 0, 4]} />
          <Lights preset="lobby" />
          <HoverBox color="royalblue" />
          <OrbitControls makeDefault />
        </View>

        {/* View 2: Pink background with orthographic camera */}
        <View index={2} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
          <color attach="background" args={['#feabda']} />
          <OrthographicCamera makeDefault position={[0, 0, 4]} zoom={100} />
          <Lights preset="city" />
          <HoverBox color="orange" />
          <OrbitControls makeDefault />
        </View>

        {/* View 3: Green background */}
        <View index={3} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
          <color attach="background" args={['#bbfeeb']} />
          <PerspectiveCamera makeDefault position={[0, 0, 4]} />
          <Lights preset="dawn" />
          <HoverBox color="purple" />
          <OrbitControls makeDefault />
        </View>

        {/* View 4: Light blue background */}
        <View index={4} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
          <color attach="background" args={['#d6edf3']} />
          <PerspectiveCamera makeDefault position={[-1, 1, 2]} fov={25} />
          <Lights preset="warehouse" />
          <HoverBox color="teal" />
          <OrbitControls makeDefault />
        </View>
      </div>

      {/* Single Canvas shared by all Views - eventSource binds pointer events to container */}
      <Canvas
        eventSource={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      >
        {/* View.Port renders each View's content to its tracked region */}
        <View.Port />
      </Canvas>
    </div>
  )
}

//* Stories ==============================

export const ViewSt = {
  render: () => <ViewDemo />,
  name: 'Default',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Story

