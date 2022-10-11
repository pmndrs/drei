import { ComponentMeta, ComponentStory } from '@storybook/react'
import * as React from 'react'
import { Suspense } from 'react'
import { Vector3 } from 'three'
import { Svg } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Abstractions/Svg',
  component: Svg,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 200)}>{storyFn()}</Setup>],
  args: {
    src: 'https://threejs.org/examples/models/svg/tiger.svg',
  },
} as ComponentMeta<typeof Svg>

export const SvgSt: ComponentStory<typeof Svg> = (props) => (
  <Suspense fallback={null}>
    <Svg {...props} position={[-300, 300, -300]} />
  </Suspense>
)
