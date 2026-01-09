import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Icosahedron, PerspectiveCamera } from 'drei'
import { Setup } from '@sb/Setup'

export default {
  title: 'Camera/PerspectiveCamera',
  component: PerspectiveCamera,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof PerspectiveCamera>

type Story = StoryObj<typeof PerspectiveCamera>

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function PerspectiveCameraScene(props: React.ComponentProps<typeof PerspectiveCamera>) {
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
      <PerspectiveCamera {...props} />

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

export const PerspectiveCameraSceneSt = {
  args: {
    makeDefault: true,
    position: [0, 0, 10],
  },
  render: (args) => <PerspectiveCameraScene {...args} />,
  name: 'Default',
} satisfies Story
