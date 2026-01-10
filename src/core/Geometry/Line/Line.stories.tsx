import * as React from 'react'
import { Vector3 } from 'three'
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Line, OrbitControls, QuadraticBezierLine, CubicBezierLine, CatmullRomLine } from 'drei'

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][]

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
  number,
  number,
  number,
][]

export default {
  title: 'Geometry/Line',
  component: Line,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false} cameraPosition={new Vector3(0, 0, 17)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Line>

//

function BasicLineScene(props: React.ComponentProps<typeof Line>) {
  return (
    <>
      <Line {...props} points={points} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

export const BasicLineSt = {
  name: 'Basic',
  render: (args) => <BasicLineScene {...args} />,
  args: {
    color: 'red',
    lineWidth: 3,
    dashed: false,
    segments: false,
  },
  argTypes: {
    color: { control: 'color' },
    segments: { control: 'boolean' },
  },
} satisfies StoryObj<typeof Line>

//

function VertexColorsLineScene(props: React.ComponentProps<typeof Line>) {
  return (
    <>
      <Line {...props} points={points} vertexColors={colors} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

export const VertexColorsLineSt = {
  name: 'VertexColors',
  render: (args) => <VertexColorsLineScene {...args} />,
  args: {
    color: 'white',
    lineWidth: 3,
    dashed: false,
    segments: false,
  },
  argTypes: {
    color: { control: 'color' },
    segments: { control: 'boolean' },
  },
} satisfies StoryObj<typeof Line>

//

function QuadraticBezierScene(props: React.ComponentProps<typeof QuadraticBezierLine>) {
  return (
    <>
      <QuadraticBezierLine {...props} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

export const QuadraticBezierSt = {
  name: 'QuadraticBezier',
  render: (args) => <QuadraticBezierScene {...args} />,
  args: {
    start: [0, 0, 0],
    end: [4, 7, 5],
    color: 'red',
    lineWidth: 2,
    dashed: true,
  },
  argTypes: {
    segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    color: { control: 'color' },
  },
} satisfies StoryObj<typeof QuadraticBezierLine>

//

function CubicBezierScene(props: React.ComponentProps<typeof CubicBezierLine>) {
  return (
    <>
      <CubicBezierLine {...props} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

export const CubicBezierSt = {
  name: 'CubicBezier',
  render: (args) => <CubicBezierScene {...args} />,
  args: {
    start: [0, 0, 0],
    end: [10, 0, 10],
    midA: [5, 4, 0],
    midB: [0, 0, 5],
    color: 'red',
    lineWidth: 2,
    dashed: true,
  },
  argTypes: {
    segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    color: { control: 'color' },
  },
} satisfies StoryObj<typeof CubicBezierLine>

//

const catPoints = [
  [0, 0, 0] as [number, number, number],
  [-8, 6, -5] as [number, number, number],
  [-2, 3, 7] as [number, number, number],
  [6, 4.5, 3] as [number, number, number],
  [0.5, 8, -1] as [number, number, number],
]

function CatmullRomScene(props: React.ComponentProps<typeof CatmullRomLine>) {
  return (
    <>
      <CatmullRomLine {...props} points={catPoints} />
      <OrbitControls zoomSpeed={0.5} />
    </>
  )
}

export const CatmullRomSt = {
  name: 'CatmullRom',
  render: (args) => <CatmullRomScene {...args} />,
  args: {
    closed: false,
    curveType: 'centripetal',
    tension: 0.5,
    color: 'red',
    lineWidth: 3,
    dashed: true,
  },
  argTypes: {
    curveType: { control: 'select', options: ['centripetal', 'chordal', 'catmullrom'] },
    tension: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    segments: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    color: { control: 'color' },
  },
} satisfies StoryObj<typeof CatmullRomLine>
