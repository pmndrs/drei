import * as React from 'react'
import { BufferGeometry, Material, Vector3 } from 'three'
import * as GeometryUtils from 'three/addons/utils/GeometryUtils.js'
import { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

import { OrbitControls, QuadraticBezierLine, CubicBezierLine, CatmullRomLine } from 'drei'
import { Line as LegacyLine } from './Line'
import { Line as WebGPULine } from '../../../webgpu/Geometry/Line/Line'

const points = GeometryUtils.hilbert3D(new Vector3(0), 5).map((p) => [p.x, p.y, p.z]) as [number, number, number][]

const colors = new Array(points.length).fill(0).map(() => [Math.random(), Math.random(), Math.random()]) as [
  number,
  number,
  number,
][]

export default {
  title: 'Geometry/Line',
  tags: ['dual'],
  component: LegacyLine,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        limitedTo={context.parameters.limitedTo ?? null}
        controls={false}
        cameraPosition={new Vector3(0, 0, 17)}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof LegacyLine>

//

function BasicLineScene(props: React.ComponentProps<typeof LegacyLine>) {
  return (
    <>
      <PlatformSwitch
        legacy={<LegacyLine {...props} points={points} />}
        webgpu={<WebGPULine {...(props as any)} points={points} />}
      />
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
} satisfies StoryObj<typeof LegacyLine>

//

const initialLifecyclePoints = [
  [0, 0, 0],
  [1, 1, 1],
] as [number, number, number][]

const updatedLifecyclePoints = [
  [0, 0, 0],
  [2, 1, 1],
] as [number, number, number][]

type LineLifecycleResult = {
  complete: boolean
  initialMaterial?: Material
  materialAfterPoints?: Material
  materialAfterColor?: Material
  initialGeometry?: BufferGeometry
  geometryAfterPoints?: BufferGeometry
  geometryAfterColor?: BufferGeometry
  initialMaterialDisposeCount: number
  currentMaterialDisposeCount: number
  oldGeometryDisposeCount: number
  currentGeometryDisposeCount: number
  materialDisposeCountAfterPoints?: number
  geometryDisposeCountAfterPoints?: number
  materialDisposeCountAfterColor?: number
  geometryDisposeCountAfterColor?: number
}

let lineLifecycleResult: LineLifecycleResult | undefined

function LineLifecycleScene() {
  const line = React.useRef<React.ComponentRef<typeof LegacyLine>>(null)
  const phase = React.useRef(0)
  const [points, setPoints] = React.useState(initialLifecyclePoints)
  const [color, setColor] = React.useState('red')
  const [mounted, setMounted] = React.useState(true)
  const result = React.useRef<LineLifecycleResult>({
    complete: false,
    initialMaterialDisposeCount: 0,
    currentMaterialDisposeCount: 0,
    oldGeometryDisposeCount: 0,
    currentGeometryDisposeCount: 0,
  })

  lineLifecycleResult = result.current

  React.useEffect(() => {
    const current = result.current

    if (!mounted) {
      current.complete = true
      return
    }

    const instance = line.current
    if (!instance) return

    if (phase.current === 0) {
      current.initialMaterial = instance.material as Material
      current.initialGeometry = instance.geometry
      current.initialMaterial.addEventListener('dispose', () => current.initialMaterialDisposeCount++)
      current.initialGeometry.addEventListener('dispose', () => current.oldGeometryDisposeCount++)

      phase.current = 1
      setPoints(updatedLifecyclePoints)
      return
    }

    if (phase.current === 1) {
      current.materialAfterPoints = instance.material as Material
      current.geometryAfterPoints = instance.geometry
      current.materialDisposeCountAfterPoints = current.initialMaterialDisposeCount
      current.geometryDisposeCountAfterPoints = current.oldGeometryDisposeCount
      current.materialAfterPoints.addEventListener('dispose', () => current.currentMaterialDisposeCount++)
      current.geometryAfterPoints.addEventListener('dispose', () => current.currentGeometryDisposeCount++)

      phase.current = 2
      setColor('blue')
      return
    }

    if (phase.current === 2) {
      current.materialAfterColor = instance.material as Material
      current.geometryAfterColor = instance.geometry
      current.materialDisposeCountAfterColor = current.initialMaterialDisposeCount
      current.geometryDisposeCountAfterColor = current.oldGeometryDisposeCount

      phase.current = 3
      setMounted(false)
    }
  }, [color, mounted, points])

  return mounted ? <LegacyLine ref={line} points={points} color={color} /> : null
}

export const Lifecycle = {
  name: 'Lifecycle',
  tags: ['!dev', '!autodocs', 'test', 'legacyOnly'],
  parameters: { limitedTo: 'legacy' },
  render: () => <LineLifecycleScene />,
  play: async () => {
    await waitFor(() => expect(lineLifecycleResult?.complete).toBe(true))

    const result = lineLifecycleResult!
    expect(result.materialAfterPoints).toBe(result.initialMaterial)
    expect(result.geometryAfterPoints).not.toBe(result.initialGeometry)
    expect(result.materialDisposeCountAfterPoints).toBe(0)
    expect(result.geometryDisposeCountAfterPoints).toBe(1)

    expect(result.materialAfterColor).toBe(result.materialAfterPoints)
    expect(result.geometryAfterColor).toBe(result.geometryAfterPoints)
    expect(result.materialDisposeCountAfterColor).toBe(0)
    expect(result.geometryDisposeCountAfterColor).toBe(1)

    expect(result.initialMaterialDisposeCount).toBe(1)
    expect(result.currentMaterialDisposeCount).toBe(1)
    expect(result.oldGeometryDisposeCount).toBe(1)
    expect(result.currentGeometryDisposeCount).toBe(1)
  },
} satisfies StoryObj<typeof LegacyLine>

//

function VertexColorsLineScene(props: React.ComponentProps<typeof LegacyLine>) {
  return (
    <>
      <PlatformSwitch
        legacy={<LegacyLine {...props} points={points} vertexColors={colors} />}
        webgpu={<WebGPULine {...(props as any)} points={points} vertexColors={colors} />}
      />
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
} satisfies StoryObj<typeof LegacyLine>

//

function QuadraticBezierScene(props: React.ComponentProps<typeof QuadraticBezierLine>) {
  return (
    <>
      <PlatformSwitch
        legacy={<QuadraticBezierLine {...props} />}
        webgpu={<QuadraticBezierLine {...props} LineComponent={WebGPULine as any} />}
      />
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
      <PlatformSwitch
        legacy={<CubicBezierLine {...props} />}
        webgpu={<CubicBezierLine {...props} LineComponent={WebGPULine as any} />}
      />
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
      <PlatformSwitch
        legacy={<CatmullRomLine {...props} points={catPoints} />}
        webgpu={<CatmullRomLine {...props} points={catPoints} LineComponent={WebGPULine as any} />}
      />
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
