import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Cloud, OrbitControls } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Staging/Cloud',
  component: Cloud,
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Cloud>

type Story = StoryObj<typeof Cloud>

function CloudScene(props: ComponentProps<typeof Cloud>) {
  return (
    <>
      <React.Suspense fallback={null}>
        <Cloud {...props} position={[-4, -2, 0]} />
        <Cloud {...props} position={[-4, 2, 0]} />
        <Cloud {...props} />
        <Cloud {...props} position={[4, -2, 0]} />
        <Cloud {...props} position={[4, 2, 0]} />
      </React.Suspense>
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const CloudSt = {
  render: (args) => <CloudScene {...args} />,
  name: 'Default',
} satisfies Story
