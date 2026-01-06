import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Example, ExampleApi } from 'drei'

export default {
  title: 'Misc/Example',
  component: Example,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(1, 2, 4)} cameraFov={60}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Example>

type Story = StoryObj<typeof Example>

function ExampleScene(props: React.ComponentProps<typeof Example>) {
  const apiRef = React.useRef<ExampleApi>(null)

  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <Example
        {...props}
        ref={apiRef}
        onClick={(e) => {
          if ((e as any as PointerEvent).metaKey) {
            apiRef.current?.decr()
          } else {
            apiRef.current?.incr()
          }
        }}
      />
    </>
  )
}

export const ExampleSt = {
  render: (args) => <ExampleScene {...args} />,

  args: {
    font: '/fonts/Inter_Bold.json',
    bevelSize: undefined,
    color: '#cbcbcb',
    debug: false,
  },

  argTypes: {
    font: { control: 'select', options: ['/fonts/Inter_Bold.json', '/fonts/helvetiker_regular.typeface.json'] },
    bevelSize: { control: { type: 'range', min: 0, max: 0.1, step: 0.01 } },
    color: { control: { type: 'color' } },
    debug: { control: { type: 'boolean' } },
  },

  name: 'Default',
} satisfies Story
