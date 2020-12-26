import * as  React from 'react'

import { Setup } from '../Setup'
import { useFBX } from '../../src/useFBX'
import { useCubeTexture } from '../../src'

export default {
  title: 'Loaders/FBX',
  component: useFBX,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 5]}>{storyFn()}</Setup>],
}

function SuzanneFBX() {
  const fbx = useFBX('suzanne/suzanne.fbx')
  const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })

  return <mesh {...fbx.children[0]} material-envMap={envMap} material-reflectivity={1} />
}

function UseFBXScene() {
  return (
    <React.Suspense fallback={null}>
      <SuzanneFBX />
    </React.Suspense>
  )
}

export const UseFBXSceneSt = () => <UseFBXScene />
UseFBXSceneSt.story = {
  name: 'Default',
}
