import * as React from 'react'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { withKnobs } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Segment, Segments, OrbitControls, SegmentObject } from '../../src'

export default {
  title: 'Performance/Segments',
  component: Segments,
}

export function BasicSegments() {
  return (
    <>
      <Segments limit={6} lineWidth={2.0}>
        <Segment start={[0, 0, 0]} end={[10, 0, 0]} color={'red'} />
        <Segment start={[0, 0, 0]} end={[0, 10, 0]} color={'blue'} />
        <Segment start={[0, 0, 0]} end={[0, 0, 10]} color={'green'} />
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

function AnimatedSegments() {
  const ref = React.useRef<SegmentObject[]>([])
  useFrame(({ clock }) => {
    ref.current.forEach((r, i) => {
      const time = clock.elapsedTime
      const x = Math.sin((i / 5000) * Math.PI) * 10
      const y = Math.cos((i / 5000) * Math.PI) * 10
      const z = Math.cos((i * time) / 1000)
      r.start.set(x, y, z)
      r.end.set(x + Math.sin(time + i), y + Math.cos(time + i), z)
      r.color.setRGB(x / 10, y / 10, z)
    })
  })
  return (
    <Segments limit={10000} lineWidth={0.1}>
      {Array.from({ length: 10000 }).map((_, i) => (
        <Segment key={i} ref={(r) => (ref.current[i] = r)} color="orange" start={[0, 0, 0]} end={[0, 0, 0]} />
      ))}
    </Segments>
  )
}

export function ManySegments() {
  return (
    <>
      <AnimatedSegments />
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
