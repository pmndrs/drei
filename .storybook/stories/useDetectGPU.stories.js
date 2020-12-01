import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import { useDetectGPU } from '../../src/useDetectGPU'
import { Text } from '../../src/Text'

export default {
  title: 'Misc/useDetectGPU',
  component: useDetectGPU,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 5]}>{storyFn()}</Setup>],
}

function Simple() {
  const GPUTier = useDetectGPU()

  return GPUTier ? (
    <Text>
      Tier {GPUTier.tier.toString()} {GPUTier.type}
    </Text>
  ) : (
    <Text>
      Detecting GPU …
    </Text>
  )
}

export const DefaultStory = () => (
  <Simple />
)
DefaultStory.storyName = 'Default'
