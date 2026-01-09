import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Stars, Plane } from 'drei'

export default {
  title: 'Staging/Stars',
  tags: ['dual'],
  component: Stars,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
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
