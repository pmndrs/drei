import * as React from 'react'
import { Vector3 } from 'three'
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils'
import { withKnobs, number, color, boolean } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Line, OrbitControls, QuadraticBezierLine } from '../../src'

export default {
  title: 'Abstractions/Line',
  component: Line,
}

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][]

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
  number,
  number,
  number
][]

export function BasicLine() {
  return (
    <>
      <Line
        points={points}
        color={color('color', 'red')}
        lineWidth={number('lineWidth', 3)}
        dashed={boolean('dashed', false)}
      />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
BasicLine.storyName = 'Basic'

BasicLine.decorators = [
  withKnobs,
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

export function QuadraticBezier() {
  return (
    <>
      <QuadraticBezierLine
        start={[number('startX', 0), number('startY', 0), number('startZ', 0)]}
        end={[number('endX', 4), number('endY', 7), number('endZ', 5)]}
        segments={number('segments', 10)}
        color={color('color', 'red')}
        lineWidth={number('lineWidth', 2)}
        dashed={boolean('dashed', true)}
      />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
QuadraticBezier.storyName = 'QuadraticBezier'

QuadraticBezier.decorators = [
  withKnobs,
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

export function VertexColorsLine() {
  return (
    <>
      <Line
        points={points}
        color={color('color', 'white')}
        vertexColors={colors}
        lineWidth={number('lineWidth', 3)}
        dashed={boolean('dashed', false)}
      />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
VertexColorsLine.storyName = 'VertexColors'

VertexColorsLine.decorators = [
  withKnobs,
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]
