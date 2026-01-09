import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { useGLTF, Merged, Instance } from 'drei'

export default {
  title: 'Performance/Merged',
  component: Merged,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Merged>

type Story = StoryObj<typeof Merged>

function Scene() {
  const { nodes } = useGLTF('suzanne.glb', true)
  return <Merged meshes={nodes}>{({ Suzanne }) => <Suzanne />}</Merged>
}

export const DefaultStory = {
  render: (args) => <Scene {...args} />,
  name: 'Default',
} satisfies Story
