import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import { MathUtils, NoToneMapping, Vector3 } from 'three'

import { Setup } from '../Setup'

import { Svg } from '../../src'

export default {
  title: 'Abstractions/Svg',
  component: Svg,
  decorators: [
    (Story) => (
      <Setup
        gl={{ toneMapping: NoToneMapping }}
        onCreated={(st) => st.gl.setClearColor('#ccc')}
        cameraPosition={new Vector3(0, 0, 200)}
        lights={false}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Svg>

type Story = StoryObj<typeof Svg>

function SvgScene(props: React.ComponentProps<typeof Svg>) {
  return (
    <>
      <Svg {...props} position={[-70, 70, 0]} scale={0.25} />

      <gridHelper args={[160, 10]} rotation={[MathUtils.DEG2RAD * 90, 0, 0]} />
    </>
  )
}

export const SvgSt = {
  args: {
    src: 'images/tiger.svg',
  },
  render: (args) => <SvgScene {...args} />,
  name: 'Default',
} satisfies Story
