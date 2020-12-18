import React, { Suspense } from 'react'
import { withKnobs, select, boolean } from '@storybook/addon-knobs'
import { Setup } from '../Setup'

import { Environment } from '../../src/Environment'
import { OrbitControls } from '../../src/OrbitControls'
import presetsObj from '../../src/helpers/cubemap-assets.json'

export default {
  title: 'Abstractions/Environment',
  component: Environment,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={[0, 0, 10]} controls={false}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function TorusKnot() {
  return (
    <mesh>
      <torusKnotBufferGeometry args={[1, 0.5, 128, 32]} />
      <meshStandardMaterial metalness={1} roughness={0} specular={1} />
    </mesh>
  )
}

function EnvironmentStory() {
  const presets = Object.keys(presetsObj)
  const preset = select('Preset', presets, presets[0])
  return (
    <>
      <Suspense fallback={null}>
        <Environment preset={preset} background={boolean('Background', true)} />
        <TorusKnot />
      </Suspense>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt = () => <EnvironmentStory />
EnvironmentSt.storyName = 'Default'
