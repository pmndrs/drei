import * as React from 'react'
import { MathUtils, Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Point, Points, PointMaterial } from 'drei'
import { shaderMaterial } from '../../../legacy/Materials/shaderMaterial/shaderMaterial'
import { extend, useFrame, useThree } from '@react-three/fiber'

import { lerp, quat, remap, vec3, type Quat, type Vec3 } from 'math'

export default {
  title: 'Geometry/Points',
  component: Points,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(10, 10, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Points>

type Story = StoryObj<typeof Points>

const rotationAxis: Vec3 = [0, 1, 0]
const q = quat.create()
const v = vec3.create()

// Rotates every xyz triplet of `buffer` by `q`, in place
function rotateBuffer(buffer: Float32Array, q: Quat) {
  for (let i = 0; i < buffer.length; i += 3) {
    vec3.set(v, buffer[i], buffer[i + 1], buffer[i + 2])
    vec3.transformQuat(v, v, q)
    buffer[i] = v[0]
    buffer[i + 1] = v[1]
    buffer[i + 2] = v[2]
  }
}

// Writes the element-wise lerp of `a` and `b` into `out`
function lerpBuffer(a: Float32Array, b: Float32Array, out: Float32Array, t: number) {
  for (let i = 0; i < out.length; i++) out[i] = lerp(a[i], b[i], t)
}

const MyPointsMaterial = shaderMaterial(
  {
    u: 1,
  },
  /* glsl */ `
    attribute float size;
    attribute vec3 color;

    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      gl_PointSize = size * ( 300.0 / -mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }

  `,
  /* glsl */ `
    varying vec3 vColor;

    void main() {
      gl_FragColor = vec4( vColor, 1.0 );

      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `
)

extend({ MyPointsMaterial })

// @ts-ignore
const makeBuffer = (...args) => Float32Array.from(...args)

function BasicPointsBufferScene(props: React.ComponentProps<typeof Points>) {
  const n = 10_000
  const [positionA] = React.useState(() => makeBuffer({ length: n * 3 }, () => MathUtils.randFloatSpread(5)))
  const [positionB] = React.useState(() => makeBuffer({ length: n * 3 }, () => MathUtils.randFloatSpread(10)))
  const [positionFinal] = React.useState(() => positionB.slice(0))
  const [color] = React.useState(() => makeBuffer({ length: n * 3 }, () => Math.random()))
  const [size] = React.useState(() => makeBuffer({ length: n }, () => Math.random() * 0.2))

  useFrame(({ elapsed }) => {
    const et = elapsed
    const t = remap(Math.sin(et), -1, 1, 0, 1)

    rotateBuffer(color, quat.setAxisAngle(q, rotationAxis, t * 0.01))

    lerpBuffer(positionA, positionB, positionFinal, t)
    rotateBuffer(positionB, quat.setAxisAngle(q, rotationAxis, t * t * 0.1))
  })

  return (
    <>
      <Points {...props} positions={positionFinal} colors={color} sizes={size}>
        {/* @ts-ignore */}
        <myPointsMaterial />
      </Points>
    </>
  )
}

export const BasicPointsBuffer = {
  render: (args) => <BasicPointsBufferScene {...args} />,
  name: 'Buffer',
} satisfies Story

//

function PointEvent({ color, ...props }) {
  const [hovered, setHover] = React.useState(false)
  const [clicked, setClick] = React.useState(false)
  return (
    <Point
      {...props}
      color={clicked ? 'hotpink' : hovered ? 'red' : color}
      onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
      onPointerOut={() => setHover(false)}
      onClick={(e) => (e.stopPropagation(), setClick((state) => !state))}
    />
  )
}

function BasicPointsInstancesScene(props: React.ComponentProps<typeof Points>) {
  const [points] = React.useState(() => {
    const n = 10
    return Array.from({ length: n * n * n }, () => {
      return [MathUtils.randFloatSpread(4), MathUtils.randFloatSpread(4), MathUtils.randFloatSpread(4)]
    })
  })
  const raycaster = useThree((state) => state.raycaster)
  React.useEffect(() => {
    if (raycaster.params.Points) {
      const old = raycaster.params.Points.threshold
      raycaster.params.Points.threshold = 0.05
      return () => {
        if (raycaster.params.Points) raycaster.params.Points.threshold = old
      }
    }
  }, [])
  return (
    <>
      <Points {...props}>
        {points.map((p) => (
          <PointEvent
            position={p as [number, number, number]}
            color={p as [number, number, number]}
            size={Math.random() * 0.5 + 0.1}
          />
        ))}
        {/* @ts-ignore */}
        <myPointsMaterial />
      </Points>
    </>
  )
}

export const BasicPointsInstances = {
  render: (args) => <BasicPointsInstancesScene {...args} />,
  name: 'Instances',
} satisfies Story

//

function BasicPointsInstancesSelectionScene(props: React.ComponentProps<typeof Points>) {
  const [points] = React.useState(() =>
    Array.from({ length: 100 }, () => [
      MathUtils.randFloatSpread(10),
      MathUtils.randFloatSpread(10),
      MathUtils.randFloatSpread(10),
    ])
  )

  const raycaster = useThree((state) => state.raycaster)
  React.useEffect(() => {
    if (raycaster.params.Points) {
      const old = raycaster.params.Points.threshold
      raycaster.params.Points.threshold = 0.175
      return () => {
        if (raycaster.params.Points) raycaster.params.Points.threshold = old
      }
    }
  }, [])

  return (
    <>
      <Points {...props} limit={points.length} range={points.length}>
        <PointMaterial transparent vertexColors size={15} sizeAttenuation={false} depthWrite={false} />
        {points.map((position, i) => (
          <PointEvent key={i} color="orange" position={position} />
        ))}
      </Points>
    </>
  )
}

export const BasicPointsInstancesSelection = {
  render: (args) => <BasicPointsInstancesSelectionScene {...args} />,
  name: 'Selection',
} satisfies Story
