import * as React from 'react'
import { Vector3 } from 'three'

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
  ],
}

export const EnvironmentStory = ({ background, preset }) => (
  <>
    <React.Suspense fallback={null}>
      <Environment preset={preset} background={background} />
      <mesh>
        <torusKnotBufferGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
    </React.Suspense>
    <OrbitControls autoRotate />
  </>
)

const presets = Object.keys(presetsObj)

EnvironmentStory.args = {
  background: true,
  preset: presets[0],
}

EnvironmentStory.argTypes = {
  preset: {
    options: presets,
    control: {
      type: 'select',
    },
  },
}

EnvironmentStory.storyName = 'Default'

export const EnvironmentFilesStory = ({ background }) => (
  <>
    <React.Suspense fallback={null}>
      <Environment
        background={background}
        path={`cube/`}
        files={[`px.png`, `nx.png`, `py.png`, `ny.png`, `pz.png`, `nz.png`]}
      />
      <mesh>
        <torusKnotBufferGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
    </React.Suspense>
    <OrbitControls autoRotate />
  </>
)

EnvironmentFilesStory.args = {
  background: true,
}

EnvironmentFilesStory.storyName = 'Files'
