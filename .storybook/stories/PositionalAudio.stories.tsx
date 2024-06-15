import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { PositionalAudio } from '../../src'

export default {
  title: 'Abstractions/PositionalAudio',
  component: PositionalAudio,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 20)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof PositionalAudio>

type Story = StoryObj<typeof PositionalAudio>

function PositionalAudioScene(props: React.ComponentProps<typeof PositionalAudio>) {
  const args = React.useMemo(
    () => [
      {
        position: new Vector3(10, 0, 10),
        url: 'sounds/1.mp3',
      },
      {
        position: new Vector3(-10, 0, 10),
        url: 'sounds/2.mp3',
      },
      {
        position: new Vector3(10, 0, -10),
        url: 'sounds/3.mp3',
      },
      {
        position: new Vector3(-10, 0, -10),
        url: 'sounds/4.mp3',
      },
    ],
    []
  )

  return (
    <group position={[0, 0, 5]}>
      {args.map(({ position, url }, index) => (
        <mesh key={`0${index}`} position={position}>
          <sphereGeometry />
          <meshBasicMaterial wireframe color="hotpink" />
          <PositionalAudio {...props} url={url} />
        </mesh>
      ))}
    </group>
  )
}

export const PositionalAudioSceneSt = {
  render: (args) => <PositionalAudioScene {...args} />,
  name: 'Default',
} satisfies Story
