import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { MathUtils, NoToneMapping, Vector3 } from 'three'

import { Setup } from '@sb/Setup'

import { Svg } from 'drei'

export default {
  title: 'Helpers/Svg',
  component: Svg,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        rendererParams={{ toneMapping: NoToneMapping }}
        onCreated={(st) => st.renderer.setClearColor('#ccc')}
        cameraPosition={new Vector3(0, 0, 200)}
        lights={false}
        floor={false}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Svg>

type Story = StoryObj<typeof Svg>

export const SvgSt = {
  args: {
    src: 'images/tiger.svg',
  },
  render: (args) => (
    <>
      <Svg {...args} position={[-70, 70, 0]} scale={0.25} />

      <gridHelper args={[160, 10]} rotation={[MathUtils.DEG2RAD * 90, 0, 0]} />
    </>
  ),
  name: 'Default',
} satisfies Story
