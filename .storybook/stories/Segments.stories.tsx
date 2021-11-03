import * as React from 'react'
import { Vector3 } from 'three'
import { withKnobs } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Segment, Segments, OrbitControls } from '../../src'
import { useFrame } from '@react-three/fiber'

export default {
  title: 'Performance/Segments',
  component: Segments,
}

export function BasicSegments() {
  return (
    <>
      <Segments limit={6} lineWidth={2.0}>
        <Segment start={[0, 0, 0]} end={[10, 0, 0]} color={[0, 0, 1]} />
        <Segment start={[0, 0, 0]} end={[0, 10, 0]} color={[0, 1, 1]} />
        <Segment start={[0, 0, 0]} end={[0, 0, 10]} color={[1, 0, 1]} />
        <Segment start={[0, 0, 0]} end={[-10, 0, 0]} color={[1, 0, 0]} />
        <Segment start={[0, 0, 0]} end={[0, -10, 0]} color={[0, 1, 0]} />
        <Segment start={[0, 0, 0]} end={[0, 0, -10]} color={[1, 1, 0]} />
      </Segments>
      <OrbitControls />
    </>
  )
}

BasicSegments.storyName = 'Basic'

BasicSegments.decorators = [
  withKnobs,
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(10, 10, 10)}>
      {storyFn()}
    </Setup>
  ),
]

function Spinner({ delay }) {
  const ref = React.useRef({ start: [0, 0, 0], end: [1, 1, 1], color: [1, 1, 1] })

  const x = Math.sin((delay / 5000) * Math.PI) * 10
  const y = Math.cos((delay / 5000) * Math.PI) * 10

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    const z = Math.cos((delay * time) / 1000)
    ref.current.start = [x, y, z]
    ref.current.end = [x + Math.sin(time + delay), y + Math.cos(time + delay), z]
  })
  return <Segment ref={ref} />
}

export function ManySegments() {
  return (
    <>
      <Segments limit={10000} lineWidth={0.1}>
        {Array.from({ length: 10000 }).map((_, i) => (
          <Spinner key={i} delay={i} />
        ))}
      </Segments>
      <OrbitControls />
    </>
  )
}
ManySegments.storyName = 'Performance'

ManySegments.decorators = [
  withKnobs,
  (storyFn) => (
    <Setup controls={false} cameraPosition={new Vector3(10, 10, 10)}>
      {storyFn()}
    </Setup>
  ),
]
