import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Stats } from '../../src'

export default {
  title: 'Misc/Stats',
  component: Stats,
  decorators: [
    (Story) => (
      <Setup>
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
