import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Icosahedron, OrthographicCamera } from '@react-three/drei'
import { Setup } from '../Setup'

export default {
  title: 'Camera/OrthographicCamera',
  component: OrthographicCamera,
  decorators: [
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof OrthographicCamera>

type Story = StoryObj<typeof OrthographicCamera>

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function OrthographicCameraScene(props: React.ComponentProps<typeof OrthographicCamera>) {
  const positions = React.useMemo(() => {
    const pos: Positions[] = []
    const half = (NUM - 1) / 2

    for (let x = 0; x < NUM; x++) {
      for (let y = 0; y < NUM; y++) {
        pos.push({
          id: `${x}-${y}`,
          position: [(x - half) * 4, (y - half) * 4, 0],
        })
      }
    }

    return pos
  }, [])

  return (
    <>
      <OrthographicCamera {...props} />

      <group position={[0, 0, -10]}>
        {positions.map(({ id, position }) => (
          <Icosahedron key={id} position={position} args={[1, 1]}>
            <meshBasicMaterial color="white" wireframe />
          </Icosahedron>
        ))}
      </group>
    </>
  )
}

export const OrthographicCameraSceneSt = {
  args: {
    makeDefault: true,
    position: [0, 0, 10],
    zoom: 40,
  },
  render: (args) => <OrthographicCameraScene {...args} />,
  name: 'Default',
} satisfies Story
