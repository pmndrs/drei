import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { StatsGl } from 'drei'

export default {
  title: 'Performance/StatsGl',
  component: StatsGl,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
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
