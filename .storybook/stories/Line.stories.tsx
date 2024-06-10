import * as React from 'react'
import { Vector3 } from 'three'
import { GeometryUtils } from 'three-stdlib'

import { Setup } from '../Setup'

import { Line, OrbitControls, QuadraticBezierLine, CubicBezierLine, CatmullRomLine } from '../../src'

export default {
  title: 'Shapes/Line',
  component: Line,
}

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][]

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
  number,
  number,
  number
][]

export function BasicLine(args) {
  return (
    <>
      <Line points={points} {...args} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
BasicLine.storyName = 'Basic'
BasicLine.args = {
  color: 'red',
  lineWidth: 3,
  dashed: false,
}
BasicLine.argTypes = {
  color: { control: 'color' },
}

BasicLine.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

export function QuadraticBezier(args) {
  return (
    <>
      <QuadraticBezierLine {...args} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
QuadraticBezier.storyName = 'QuadraticBezier'
QuadraticBezier.args = {
  start: [0, 0, 0],
  end: [4, 7, 5],
  segments: 10,
  color: 'red',
  lineWidth: 2,
  dashed: true,
  foo: 3,
}
QuadraticBezier.argTypes = {
  segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  color: { control: 'color' },
}

QuadraticBezier.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

export function CubicBezier(args) {
  return (
    <>
      <CubicBezierLine {...args} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
CubicBezier.storyName = 'CubicBezier'
CubicBezier.args = {
  start: [0, 0, 0],
  end: [10, 0, 10],
  midA: [5, 4, 0],
  midB: [0, 0, 5],
  segments: 10,
  color: 'red',
  lineWidth: 2,
  dashed: true,
}
CubicBezier.argTypes = {
  segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  color: { control: 'color' },
}

CubicBezier.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

const catPoints = [
  [0, 0, 0] as [number, number, number],
  [-8, 6, -5] as [number, number, number],
  [-2, 3, 7] as [number, number, number],
  [6, 4.5, 3] as [number, number, number],
  [0.5, 8, -1] as [number, number, number],
]

export function CatmullRom(args) {
  return (
    <>
      <CatmullRomLine points={catPoints} {...args} segments={20} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
CatmullRom.storyName = 'CatmullRom'
CatmullRom.args = {
  closed: false,
  curveType: 'centripetal',
  tension: 0.5,
  segments: 20,
  color: 'red',
  lineWidth: 3,
  dashed: true,
}
CatmullRom.argTypes = {
  curveType: { control: 'select', options: ['centripetal', 'chordal', 'catmullrom'] },
  tension: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  color: { control: 'color' },
}

CatmullRom.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]

export function VertexColorsLine(args) {
  return (
    <>
      <Line points={points} vertexColors={colors} {...args} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}
VertexColorsLine.storyName = 'VertexColors'
VertexColorsLine.args = {
  color: 'white',
  lineWidth: 3,
  dashed: false,
}
VertexColorsLine.argTypes = {
  color: { control: 'color' },
}

VertexColorsLine.decorators = [
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(0, 0, 17)}>
      {storyFn()}
    </Setup>
  ),
]
