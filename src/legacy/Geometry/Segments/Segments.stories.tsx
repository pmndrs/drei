import * as React from 'react'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

import { OrbitControls } from 'drei'
import { Segment as LegacySegment, Segments as LegacySegments } from './Segments'
import { Segment as WebGPUSegment, Segments as WebGPUSegments } from '../../../webgpu/Geometry/Segments/Segments'

export default {
  title: 'Geometry/Segments',
  tags: ['dual'],
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false} cameraPosition={new Vector3(10, 10, 10)}>
        <Story />
      </Setup>
    ),
  ],
  component: LegacySegments,
} satisfies Meta<typeof LegacySegments>

type Story = StoryObj<typeof LegacySegments>

function BasicSegmentsScene(props: React.ComponentProps<typeof LegacySegments>) {
  return (
    <>
      <PlatformSwitch
        legacy={
          <LegacySegments {...props}>
            <LegacySegment start={[0, 0, 0]} end={[10, 0, 0]} color={'red'} />
            <LegacySegment start={[0, 0, 0]} end={[0, 10, 0]} color={'blue'} />
            <LegacySegment start={[0, 0, 0]} end={[0, 0, 10]} color={'green'} />
            <LegacySegment start={[0, 0, 0]} end={[-10, 0, 0]} color={[1, 0, 0]} />
            <LegacySegment start={[0, 0, 0]} end={[0, -10, 0]} color={[0, 1, 0]} />
            <LegacySegment start={[0, 0, 0]} end={[0, 0, -10]} color={[1, 1, 0]} />
          </LegacySegments>
        }
        webgpu={
          <WebGPUSegments {...(props as any)}>
            <WebGPUSegment start={[0, 0, 0]} end={[10, 0, 0]} color={'red'} />
            <WebGPUSegment start={[0, 0, 0]} end={[0, 10, 0]} color={'blue'} />
            <WebGPUSegment start={[0, 0, 0]} end={[0, 0, 10]} color={'green'} />
            <WebGPUSegment start={[0, 0, 0]} end={[-10, 0, 0]} color={[1, 0, 0]} />
            <WebGPUSegment start={[0, 0, 0]} end={[0, -10, 0]} color={[0, 1, 0]} />
            <WebGPUSegment start={[0, 0, 0]} end={[0, 0, -10]} color={[1, 1, 0]} />
          </WebGPUSegments>
        }
      />
      <OrbitControls />
    </>
  )
}

export const BasicSegmentsSt = {
  args: {
    limit: 6,
    lineWidth: 2.0,
  },
  render: (args) => <BasicSegmentsScene {...args} />,
  name: 'Basic',
} satisfies Story

//

function LegacyAnimatedSegments(props: React.ComponentProps<typeof LegacySegments>) {
  const ref = React.useRef<React.ComponentRef<typeof LegacySegment>[]>([])
  useFrame(({ elapsed }) => {
    ref.current.forEach((r, i) => {
      const time = elapsed
      const x = Math.sin((i / 5000) * Math.PI) * 10
      const y = Math.cos((i / 5000) * Math.PI) * 10
      const z = Math.cos((i * time) / 1000)
      r.start.set(x, y, z)
      r.end.set(x + Math.sin(time + i), y + Math.cos(time + i), z)
      r.color.setRGB(x / 10, y / 10, z)
    })
  })
  return (
    <LegacySegments {...props}>
      {Array.from({ length: 10000 }).map((_, i) => (
        <LegacySegment
          key={i}
          ref={(r) => {
            ref.current[i] = r!
            return () => void (ref.current[i] = null!)
          }}
          color="orange"
          start={[0, 0, 0]}
          end={[0, 0, 0]}
        />
      ))}
    </LegacySegments>
  )
}

function WebGPUAnimatedSegments(props: React.ComponentProps<typeof WebGPUSegments>) {
  const ref = React.useRef<React.ComponentRef<typeof WebGPUSegment>[]>([])
  useFrame(({ elapsed }) => {
    ref.current.forEach((r, i) => {
      const time = elapsed
      const x = Math.sin((i / 5000) * Math.PI) * 10
      const y = Math.cos((i / 5000) * Math.PI) * 10
      const z = Math.cos((i * time) / 1000)
      if(!r.start || !r.end) return;
      r.start.set(x, y, z)
      r.end.set(x + Math.sin(time + i), y + Math.cos(time + i), z)
      r.color.setRGB(x / 10, y / 10, z)
    })
  })
  return (
    <WebGPUSegments {...props}>
      {Array.from({ length: 10000 }).map((_, i) => (
        <WebGPUSegment
          key={i}
          ref={(r) => {
            ref.current[i] = r!
            return () => void (ref.current[i] = null!)
          }}
          color="orange"
          start={[0, 0, 0]}
          end={[0, 0, 0]}
        />
      ))}
    </WebGPUSegments>
  )
}

function ManySegmentsScene(props: React.ComponentProps<typeof LegacySegments>) {
  return (
    <>
      <PlatformSwitch
        legacy={<LegacyAnimatedSegments {...props} />}
        webgpu={<WebGPUAnimatedSegments {...(props as any)} />}
      />
      <OrbitControls />
    </>
  )
}

export const ManySegmentsSt = {
  args: {
    limit: 10000,
    lineWidth: 0.1,
  },
  render: (args) => <ManySegmentsScene {...args} />,
  name: 'Performance',
} satisfies Story
