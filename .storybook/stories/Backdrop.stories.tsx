import * as React from 'react'
import * as THREE from 'three'
import { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Backdrop, ContactShadows, OrbitControls } from '../../src'

export default {
  title: 'Staging/Backdrop',
  component: Backdrop,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 1, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Backdrop>

type Story = StoryObj<typeof Backdrop>

function BackdropScene(props: ComponentProps<typeof Backdrop>) {
  return (
    <>
      <Backdrop receiveShadow {...props}>
        <meshStandardMaterial color="#353540" />
      </Backdrop>
      <mesh castShadow position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <ContactShadows opacity={0.5} scale={5} blur={1} far={5} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 3]} intensity={1} castShadow />
      <OrbitControls enablePan={false} />
    </>
  )
}

export const BackdropSt = {
  render: (args) => <BackdropScene {...args} />,
  name: 'Default',
  args: {
    floor: 0.25,
    segments: 20,
  },
} satisfies Story
