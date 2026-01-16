import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { StatsGl } from '@react-three/drei'

export default {
  title: 'Misc/StatsGl',
  component: StatsGl,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof StatsGl>

type Story = StoryObj<typeof StatsGl>

function StatsGlScene(props: React.ComponentProps<typeof StatsGl>) {
  return (
    <>
      <axesHelper />
      <StatsGl {...props} />
    </>
  )
}

export const StatsGlSt = {
  render: (args) => <StatsGlScene {...args} />,
  name: 'Default',
} satisfies Story
