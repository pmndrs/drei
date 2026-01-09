import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Stats } from 'drei'

export default {
  title: 'Performance/Stats',
  component: Stats,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Stats>

type Story = StoryObj<typeof Stats>

function StatsScene(props: React.ComponentProps<typeof Stats>) {
  return (
    <>
      <axesHelper />
      <Stats {...props} />
    </>
  )
}

export const StatsSt = {
  render: (args) => <StatsScene {...args} />,
  name: 'Default',
} satisfies Story
