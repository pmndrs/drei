import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Box, Center, useGLTF } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Staging/Center',
  component: Center,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, -10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Center>

type Story = StoryObj<typeof Center>

const SimpleExample = (props: ComponentProps<typeof Center>) => {
  const { scene } = useGLTF('LittlestTokyo.glb')

  const ref = useTurntable()

  return (
    <Center position={[5, 5, 10]} {...props}>
      <Box args={[10, 10, 10]}>
        <meshNormalMaterial wireframe />
      </Box>
      <primitive ref={ref} object={scene} scale={[0.01, 0.01, 0.01]} />
    </Center>
  )
}

function CenterScene(props: ComponentProps<typeof Center>) {
  return (
    <React.Suspense fallback={null}>
      <SimpleExample {...props} />
    </React.Suspense>
  )
}

export const CenterSt = {
  render: (args) => <CenterScene {...args} />,
  name: 'Default',
} satisfies Story
