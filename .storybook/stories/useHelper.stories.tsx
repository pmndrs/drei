import * as React from 'react'
import { BoxHelper, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three-stdlib/helpers/VertexNormalsHelper'

import { Setup } from '../Setup'

import { Sphere, useHelper, PerspectiveCamera } from '../../src'

export default {
  title: 'Misc/useHelper',
  component: useHelper,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function Scene() {
  const mesh = React.useRef()
  useHelper(mesh, BoxHelper, 'royalblue')
  useHelper(mesh, VertexNormalsHelper, 1, 'red')

  return (
    <Sphere ref={mesh}>
      <meshBasicMaterial attach="material" />
    </Sphere>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'

function CameraScene() {
  const camera = React.useRef()
  useHelper(camera, CameraHelper, 1, 'hotpink')

  return (
    <PerspectiveCamera makeDefault={false} position={[3, 3, 3]} ref={camera}>
      <meshBasicMaterial attach="material" />
    </PerspectiveCamera>
  )
}

export const CameraStory = () => <CameraScene />
CameraStory.storyName = 'Camera Helper'
