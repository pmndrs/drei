import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { useDetectGPU, Text } from '../../src'

export default {
  title: 'Misc/useDetectGPU',
  component: useDetectGPU,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Simple() {
  const { device, fps, gpu, isMobile, tier, type } = useDetectGPU()
  return (
    <Text maxWidth={200}>
      | device {device} fps {fps} | gpu {gpu} isMobile {isMobile?.toString()} | Tier {tier.toString()} Type {type} |
    </Text>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <Simple />
  </React.Suspense>
)
DefaultStory.storyName = 'Default'
