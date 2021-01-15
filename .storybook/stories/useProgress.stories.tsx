import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Html, useGLTF, useProgress } from '../../src'

export default {
  title: 'Misc/useProgress',
  component: useProgress,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function Helmet() {
  const { nodes } = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  return <primitive object={nodes['node_damagedHelmet_-6514']} />
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <span style={{ color: 'white' }}>{progress} % loaded</span>
    </Html>
  )
}

function UseProgressScene() {
  return (
    <React.Suspense fallback={<Loader />}>
      <Helmet />
    </React.Suspense>
  )
}

export const UseProgressSceneSt = () => <UseProgressScene />
UseProgressSceneSt.story = {
  name: 'Default',
}
