import * as React from 'react'
import { MathUtils, Quaternion, Vector3 } from 'three'

import { Setup } from '../Setup'

import { Point, Points, PointMaterial, shaderMaterial } from '../../src'
import { extend, useFrame, useThree } from '@react-three/fiber'

import * as buffer from 'maath/buffer'
import * as misc from 'maath/misc'

export default {
  title: 'Performance/Points',
  component: Points,
}

const rotationAxis = new Vector3(0, 1, 0).normalize()
const q = new Quaternion()

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

function BasicPointsBufferScene() {
  const n = 10_000
  const [positionA] = React.useState(() => makeBuffer({ length: n * 3 }, () => MathUtils.randFloatSpread(5)))
  const [positionB] = React.useState(() => makeBuffer({ length: n * 3 }, () => MathUtils.randFloatSpread(10)))
  const [positionFinal] = React.useState(() => positionB.slice(0))
  const [color] = React.useState(() => makeBuffer({ length: n * 3 }, () => Math.random()))
  const [size] = React.useState(() => makeBuffer({ length: n }, () => Math.random() * 0.2))

  useFrame(({ clock }) => {
    const et = clock.getElapsedTime()
    const t = misc.remap(Math.sin(et), [-1, 1], [0, 1])

    buffer.rotate(color, { q: q.setFromAxisAngle(rotationAxis, t * 0.01) })

    buffer.lerp(positionA, positionB, positionFinal, t)
    buffer.rotate(positionB, {
      q: q.setFromAxisAngle(rotationAxis, t * t * 0.1),
    })
  })

  return (
    <>
      <Points positions={positionFinal} colors={color} sizes={size}>
        {/* @ts-ignore */}
        <myPointsMaterial />
      </Points>
    </>
  )
}

export function BasicPointsBuffer() {
  return <BasicPointsBufferScene />
}

BasicPointsBuffer.storyName = 'Buffer'
BasicPointsBuffer.decorators = [(storyFn) => <Setup cameraPosition={new Vector3(10, 10, 10)}>{storyFn()}</Setup>]

function PointEvent({ color, ...props }) {
  const [hovered, setHover] = React.useState(false)
  const [clicked, setClick] = React.useState(false)
  return (
    <Point
      {...props}
      color={clicked ? 'hotpink' : hovered ? 'red' : color}
      onPointerOver={(e) => (e.stopPropagation(), setHover(true))}
      onPointerOut={(e) => setHover(false)}
      onClick={(e) => (e.stopPropagation(), setClick((state) => !state))}
    />
  )
}

function BasicPointsInstancesScene() {
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
      <Points>
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

export function BasicPointsInstances() {
  return <BasicPointsInstancesScene />
}

BasicPointsInstances.storyName = 'Instances'
BasicPointsInstances.decorators = [(storyFn) => <Setup cameraPosition={new Vector3(10, 10, 10)}>{storyFn()}</Setup>]

function BasicPointsInstancesSelectionScene() {
  const [points] = React.useState(() =>
    Array.from({ length: 100 }, (i) => [
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
      <Points limit={points.length} range={points.length}>
        <PointMaterial transparent vertexColors size={15} sizeAttenuation={false} depthWrite={false} />
        {points.map((position, i) => (
          <PointEvent key={i} color="orange" position={position} />
        ))}
      </Points>
    </>
  )
}

export function BasicPointsInstancesSelection() {
  return <BasicPointsInstancesSelectionScene />
}

BasicPointsInstancesSelection.storyName = 'Selection'
BasicPointsInstancesSelection.decorators = [
  (storyFn) => <Setup cameraPosition={new Vector3(10, 10, 10)}>{storyFn()}</Setup>,
]
