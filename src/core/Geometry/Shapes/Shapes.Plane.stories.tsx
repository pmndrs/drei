import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Plane } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Plane',
  component: Plane,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Plane>

type Story = StoryObj<typeof Plane>

function PlaneScene(props: React.ComponentProps<typeof Plane>) {
  const ref = useTurntable<React.ComponentRef<typeof Plane>>()

  return (
    <Plane ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Plane>
  )
}

export const PlaneSt = {
  args: {},
  render: (args) => <PlaneScene {...args} />,
  name: 'Default',
} satisfies Story
