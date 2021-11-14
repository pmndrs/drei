import * as React from 'react'
import { MathUtils, Quaternion, Vector3 } from 'three'

import { Setup } from '../Setup'

import { PointsBuffer, shaderMaterial } from '../../src'
import { extend, useFrame } from '@react-three/fiber'

import * as buffer from 'maath/buffer'
import * as misc from 'maath/misc'

export default {
  title: 'Performance/PointsBuffer',
  component: PointsBuffer,
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
    }
  `
)

extend({ MyPointsMaterial })

function BasicPointsBufferScene() {
  const [positionA] = React.useState(() =>
    Float32Array.from({ length: 10_000 * 3 }, () => MathUtils.randFloatSpread(5))
  )
  const [positionB] = React.useState(() =>
    Float32Array.from({ length: 10_000 * 3 }, () => MathUtils.randFloatSpread(10))
  )
  const [positionFinal] = React.useState(() => positionB.slice(0))

  const [color] = React.useState(() => Float32Array.from({ length: 10_000 * 3 }, () => Math.random()))
  const [size] = React.useState(() => Float32Array.from({ length: 10_000 * 3 }, () => Math.random() * 0.2))

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
      <PointsBuffer position={positionFinal} color={color} size={size}>
        {/* @ts-ignore */}
        <myPointsMaterial />
      </PointsBuffer>
    </>
  )
}

export function BasicPointsBuffer() {
  return <BasicPointsBufferScene />
}

BasicPointsBuffer.storyName = 'Basic'

BasicPointsBuffer.decorators = [(storyFn) => <Setup cameraPosition={new Vector3(10, 10, 10)}>{storyFn()}</Setup>]
