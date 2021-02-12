import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Environment, OrbitControls } from '../../src'

import { presetsObj } from '../../src/helpers/environment-assets'

export default {
  title: 'Abstractions/Environment',
  component: Environment,
  argTypes: {
    preset: {
      control: {
        type: 'select',
        options: Object.keys(presetsObj),
      },
    },
  },
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function EnvironmentStory({ cfg }) {
  return (
    <>
      <React.Suspense fallback={null}>
        <Environment preset={cfg.preset} background={cfg.background} />
        <mesh>
          <torusKnotBufferGeometry args={[1, 0.5, 128, 32]} />
          <meshStandardMaterial metalness={1} roughness={0} />
        </mesh>
      </React.Suspense>
      <OrbitControls autoRotate />
    </>
  )
}

const controlsConfig = {
  preset: Object.keys(presetsObj)[0],
  background: true,
}

export const EnvironmentSt = ({ ...args }) => <EnvironmentStory cfg={args} />
EnvironmentSt.storyName = 'Default'
EnvironmentSt.args = { ...controlsConfig }
