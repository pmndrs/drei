import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Environment, Html, useGLTF, useProgress, Loader } from '../../src'
import { withKnobs, boolean } from '@storybook/addon-knobs'

export default {
  title: 'Misc/useProgress',
  component: useProgress,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Helmet() {
  const { nodes } = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  return <primitive object={nodes['node_damagedHelmet_-6514']} />
}

function Shoe() {
  const { nodes } = useGLTF(
    'https://threejs.org/examples/models/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf'
  )

  return <primitive object={nodes['Shoe']} />
}

function CustomLoader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <span style={{ color: 'white' }}>{progress} % loaded</span>
    </Html>
  )
}

function LoadExtras() {
  return (
    <React.Suspense fallback={<CustomLoader />}>
      <Environment preset={'studio'} />
      <Shoe />
    </React.Suspense>
  )
}

function UseProgressScene() {
  return (
    <React.Suspense fallback={<CustomLoader />}>
      {boolean('Load extras', false) ? <LoadExtras /> : <Helmet />}
    </React.Suspense>
  )
}

export const UseProgressSceneSt = () => <UseProgressScene />
UseProgressSceneSt.story = {
  name: 'Default',
}

export function WithOutOfTheBoxLoader() {
  return (
    <React.Suspense
      fallback={
        <Html>
          <Loader />
        </Html>
      }
    >
      {boolean('Load extras', false) ? <LoadExtras /> : <Helmet />}
    </React.Suspense>
  )
}
