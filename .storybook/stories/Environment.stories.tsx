import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Environment, ContactShadows, PerspectiveCamera, OrbitControls } from '../../src'

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

export const EnvironmentStory = ({ background, preset, blur }) => (
  <>
    <React.Suspense fallback={null}>
      <Environment preset={preset} background={background} blur={blur} />
      <mesh>
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
    </React.Suspense>
    <OrbitControls autoRotate />
  </>
)

const presets = Object.keys(presetsObj)

EnvironmentStory.args = {
  background: true,
  blur: 0,
  preset: presets[0],
}

EnvironmentStory.argTypes = {
  preset: {
    options: presets,
    control: {
      type: 'select',
    },
  },
  blur: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
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
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
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

export const EnvironmentGroundStory = ({ preset, height, radius }) => (
  <>
    <React.Suspense fallback={null}>
      <Environment ground={{ height, radius }} preset={preset} />
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <ContactShadows resolution={1024} position={[0, 0, 0]} scale={100} blur={2} opacity={1} far={10} />
    </React.Suspense>
    <OrbitControls autoRotate />
    <PerspectiveCamera position={[40, 40, 40]} makeDefault />
  </>
)

EnvironmentGroundStory.args = {
  height: 15,
  radius: 60,
  preset: 'park',
}

EnvironmentGroundStory.argTypes = {
  preset: {
    options: presets,
    control: {
      type: 'select',
    },
  },
  height: {
    control: {
      type: 'range',
      min: 0,
      max: 50,
      step: 0.1,
    },
  },
  radius: {
    control: {
      type: 'range',
      min: 0,
      max: 200,
      step: 1,
    },
  },
}

EnvironmentGroundStory.storyName = 'Ground'
