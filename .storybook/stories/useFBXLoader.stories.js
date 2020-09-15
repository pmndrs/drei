import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import {useFBXLoader} from "../../src/loaders/useFBXLoader";
import {useCubeTextureLoader} from "../../src";
import {Vector2} from "three";

export default {
  title: 'Loaders/FBX',
  component: useFBXLoader,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 5]}>{storyFn()}</Setup>],
}

function SuzanneFBX() {
  let  fbx = useFBXLoader('suzanne/suzanne.fbx')
  return <primitive object={fbx} dispose={null} />
}

function UseFBXLoaderScene() {
  return (
    <Suspense fallback={null}>
      <SuzanneFBX />
    </Suspense>
  )
}

export const UseFBXLoaderSceneSt = () => <UseFBXLoaderScene />
UseFBXLoaderSceneSt.story = {
  name: 'Default',
}
