import * as React from 'react'
import { DoubleSide, Vector3 } from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Text, Text3D, Float, Center, Edges } from '../../src'
import { useEffect } from 'react'

export default {
  title: 'Abstractions/Text3D',
  component: Text,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Text3DScene() {
  return (
    <React.Suspense fallback={null}>
      <Center>
        <Float floatIntensity={5} speed={2}>
          <Text3D font={'/fonts/helvetiker_regular.typeface.json'} bevelEnabled bevelSize={0.05}>
            Text 3D
            <meshNormalMaterial />
          </Text3D>
        </Float>
      </Center>
    </React.Suspense>
  )
}

export const Text3DSt = () => <Text3DScene />
Text3DSt.storyName = 'Default'
