import * as React from 'react'
import { Vector3 } from 'three'
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils'

import { Setup } from '../Setup'

import { Line, OrbitControls } from '../../src'

export default {
  title: 'Abstractions/Line',
  component: Line,
  argTypes: {
    color: {
      control: {
        type: 'color',
      },
    },
  },
}

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][]

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
  number,
  number,
  number
][]

function BasicLineStory({ cfg }) {
  return (
    <>
      <Line points={points} color={cfg.color} lineWidth={cfg.lineWidth} dashed={cfg.dashed} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

const basicControlsConfig = {
  color: 'red',
  lineWidth: 3,
  dashed: false,
}

export const BasicLineSt = ({ ...args }) => <BasicLineStory cfg={args} />
BasicLineSt.storyName = 'Basic'
BasicLineSt.args = { ...basicControlsConfig }

BasicLineSt.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

function VertexColorsLineStory({ cfg }) {
  return (
    <>
      <Line points={points} color={cfg.color} vertexColors={colors} lineWidth={cfg.lineWidth} dashed={cfg.dashed} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

const vertexControlsConfig = {
  color: 'white',
  lineWidth: 3,
  dashed: false,
}

export const VertexColorsLineSt = ({ ...args }) => <VertexColorsLineStory cfg={args} />
VertexColorsLineSt.storyName = 'VertexColors'
VertexColorsLineSt.args = { ...vertexControlsConfig }

VertexColorsLineSt.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]
