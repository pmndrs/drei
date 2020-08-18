import React from 'react'
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Line } from '../../src/Line'

export default {
  title: 'Abstractions/Line',
  component: Line,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[0, 0, 17]}>
        <Story />
      </Setup>
    ),
  ],
}

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z])
const colors = new Array(points.length).fill().map(() => [Math.random(), Math.random(), Math.random()])

export function BasicLine(args) {
  return <Line points={points} {...args} />
}
BasicLine.storyName = 'Basic'

BasicLine.argTypes = {
  color: { control: 'color' },
  linewidth: { control: 'number' },
  vertexColors: { control: 'boolean' },
}

BasicLine.args = {
  color: 'red',
  linewidth: 3,
}

export const VertexColors = BasicLine.bind({})

VertexColors.storyName = 'Vertex Colors'

VertexColors.args = {
  ...BasicLine.args,
  color: 'white',
  vertexColors: colors,
}

VertexColors.argTypes = {
  vertexColors: { control: 'array' },
}
