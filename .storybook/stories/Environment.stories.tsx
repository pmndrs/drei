import * as React from 'react'
import { Vector3 } from 'three'
import { withKnobs, select, boolean } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { Environment, OrbitControls } from '../../src'

import { presetsObj } from '../../src/helpers/environment-assets'

export default {
  title: 'Staging/Environment',
  component: Environment,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)} controls={false}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function EnvironmentStory() {
  const presets = Object.keys(presetsObj)
  const preset = select('Preset', presets, presets[0])
  return (
    <>
      <React.Suspense fallback={null}>
        <Environment preset={preset as any} background={boolean('Background', true)} />
        <mesh>
          <torusKnotBufferGeometry args={[1, 0.5, 128, 32]} />
          <meshStandardMaterial metalness={1} roughness={0} />
        </mesh>
      </React.Suspense>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt = () => <EnvironmentStory />
EnvironmentSt.storyName = 'Default'
