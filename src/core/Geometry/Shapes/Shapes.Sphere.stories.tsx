import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Sphere } from 'drei'
import { useTurntable } from '@sb/useTurntable'

export default {
  title: 'Shapes/Sphere',
  component: Sphere,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Sphere>

type Story = StoryObj<typeof Sphere>

function SphereScene(props: React.ComponentProps<typeof Sphere>) {
  const ref = useTurntable<React.ComponentRef<typeof Sphere>>()

  return (
    <Sphere ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Sphere>
  )
}

export const SphereSt = {
  args: {},
  render: (args) => <SphereScene {...args} />,
  name: 'Default',
} satisfies Story
