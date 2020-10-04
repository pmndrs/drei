import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import { useProgress } from '../../src/useProgress'
import { useGLTF } from '../../src/useGLTF'
import { Html } from '../../src/Html'

export default {
  title: 'Misc/useProgress',
  component: useProgress,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 5]}>{storyFn()}</Setup>],
}

function Helmet() {
  const { nodes } = useGLTF('https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf')

  return <primitive object={nodes['node_damagedHelmet_-6514']} />
}


function Loader() {
  const { progress } = useProgress()
  return <Html center><span style={{ color: 'white' }}>{progress} % loaded</span></Html>
}

function UseProgressScene() {
  return (
    <Suspense fallback={<Loader />}>
      <Helmet />
    </Suspense>
  )
}

export const UseProgressSceneSt = () => <UseProgressScene />
UseProgressSceneSt.story = {
  name: 'Default',
}
