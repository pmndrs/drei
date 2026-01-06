import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Stars, Plane } from 'drei'

export default {
  title: 'Staging/Stars',
  component: Stars,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Stars>

type Story = StoryObj<typeof Stars>

function StarsScene(props: React.ComponentProps<typeof Stars>) {
  return (
    <>
      <Stars {...props} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const StarsSt = {
  render: (args) => <StarsScene {...args} />,
  name: 'Default',
} satisfies Story
