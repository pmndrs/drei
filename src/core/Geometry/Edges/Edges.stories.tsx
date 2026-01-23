import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Edges, OrbitControls } from 'drei'

export default {
  title: 'Geometry/Edges',
  component: Edges,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Edges>

type Story = StoryObj<typeof Edges>

function BasicEdgesScene() {
  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="hotpink" />
        <Edges color="white" threshold={15} />
      </mesh>
    </>
  )
}

export const Basic = {
  render: () => <BasicEdgesScene />,
  name: 'Basic',
} satisfies Story

function CustomThresholdScene() {
  const [threshold, setThreshold] = React.useState(15)

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="royalblue" />
        <Edges color="yellow" threshold={threshold} />
      </mesh>

      <group position={[0, -2.5, 0]}>
        <mesh position={[0, 0.1, 0]} onClick={() => setThreshold((t) => Math.max(1, t - 5))}>
          <boxGeometry args={[0.5, 0.2, 0.2]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[1, 0.1, 0]} onClick={() => setThreshold((t) => Math.min(180, t + 5))}>
          <boxGeometry args={[0.5, 0.2, 0.2]} />
          <meshBasicMaterial color="green" />
        </mesh>
      </group>
    </>
  )
}

export const CustomThreshold = {
  render: () => <CustomThresholdScene />,
  name: 'Custom Threshold',
} satisfies Story

function ScaledEdgesScene() {
  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="orange" />
        <Edges color="black" scale={1.05} lineWidth={2} />
      </mesh>
    </>
  )
}

export const ScaledEdges = {
  render: () => <ScaledEdgesScene />,
  name: 'Scaled',
} satisfies Story

function MultipleGeometriesScene() {
  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <mesh position={[-2, 0, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="tomato" />
        <Edges color="white" />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.3, 16, 32]} />
        <meshStandardMaterial color="mediumseagreen" />
        <Edges color="white" threshold={10} />
      </mesh>

      <mesh position={[2, 0, 0]}>
        <coneGeometry args={[0.7, 1.4, 8]} />
        <meshStandardMaterial color="dodgerblue" />
        <Edges color="white" />
      </mesh>
    </>
  )
}

export const MultipleGeometries = {
  render: () => <MultipleGeometriesScene />,
  name: 'Multiple Geometries',
} satisfies Story
