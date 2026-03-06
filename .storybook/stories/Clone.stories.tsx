import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Clone } from '../../src'

export default {
  title: 'Abstractions/Clone',
  component: Clone,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Clone>

type Story = StoryObj<typeof Clone>

function CloneScene(props: Omit<React.ComponentProps<typeof Clone>, 'object'>) {
  const meshRef = React.useRef<THREE.Mesh>(null!)

  return (
    <>
      {/* Source mesh */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>

      {/* Clones at different positions */}
      {meshRef.current && (
        <>
          <Clone object={meshRef.current} position={[-3, 0, 0]} {...props} />
          <Clone object={meshRef.current} position={[3, 0, 0]} {...props} />
          <Clone object={meshRef.current} position={[0, 3, 0]} {...props} />
        </>
      )}
    </>
  )
}

function CloneSceneReady(props: Omit<React.ComponentProps<typeof Clone>, 'object'>) {
  const [mesh, setMesh] = React.useState<THREE.Mesh | null>(null)

  return (
    <>
      {/* Source mesh */}
      <mesh ref={setMesh} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>

      {/* Clones at different positions */}
      {mesh && (
        <>
          <Clone object={mesh} position={[-3, 0, 0]} {...props} />
          <Clone object={mesh} position={[3, 0, 0]} {...props} />
          <Clone object={mesh} position={[0, 3, 0]} {...props} />
        </>
      )}
    </>
  )
}

/**
 * `Clone` creates copies of an existing mesh. Each clone can be positioned independently.
 */
export const CloneSt = {
  render: (args) => <CloneSceneReady {...args} />,
  name: 'Default',
} satisfies Story

//

function CloneDeepScene() {
  const [mesh, setMesh] = React.useState<THREE.Mesh | null>(null)

  return (
    <>
      {/* Source mesh */}
      <mesh ref={setMesh} position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="royalblue" />
      </mesh>

      {/* Deep clones with independent materials */}
      {mesh && (
        <>
          <Clone object={mesh} position={[-3, 0, 0]} deep inject={<meshStandardMaterial color="hotpink" />} />
          <Clone object={mesh} position={[3, 0, 0]} deep inject={<meshStandardMaterial color="orange" />} />
          <Clone object={mesh} position={[0, 3, 0]} deep inject={<meshStandardMaterial color="limegreen" />} />
        </>
      )}
    </>
  )
}

/**
 * With `deep` cloning and `inject`, each clone gets its own material and color.
 */
export const CloneDeepSt = {
  render: () => <CloneDeepScene />,
  name: 'Deep + Inject',
} satisfies Story
