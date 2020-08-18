import React, { useRef } from 'react'

import { BoxHelper, CameraHelper } from 'three'
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper'
import { FaceNormalsHelper } from 'three/examples/jsm/helpers/FaceNormalsHelper'

import { setupDecorator } from '../setup-decorator'

import { Sphere } from '../../src/shapes'
import { useHelper } from '../../src/useHelper'
import { PerspectiveCamera } from '../../src/PerspectiveCamera'

export default {
  title: 'Misc/useHelper',
  component: useHelper,
  decorators: [
    setupDecorator(),
  ],
}

function Scene() {
  const mesh = useRef()
  useHelper(mesh, BoxHelper, 'royalblue')
  useHelper(mesh, VertexNormalsHelper, 1, 'red')

  return <Sphere ref={mesh} />
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'

function CameraScene() {
  const camera = useRef()
  useHelper(camera, CameraHelper, 1, 'hotpink')

  return <PerspectiveCamera position={[3, 3, 3]} ref={camera} />
}

export const CameraStory = () => <CameraScene />
CameraStory.storyName = 'Camera Helper'
