import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Plane, useVideoTexture } from '../../src'

export default {
  title: 'Loaders/VideoTexture',
  component: useVideoTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function VideoTexturedPlane() {
  const videoTexture = useVideoTexture(
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    {}
  )

  return (
    <>
      <Plane>
        <meshBasicMaterial side={THREE.DoubleSide} map={videoTexture} toneMapped={false} />
      </Plane>
    </>
  )
}

function UseVideoTextureScene() {
  return (
    <React.Suspense fallback={null}>
      <VideoTexturedPlane />
    </React.Suspense>
  )
}

export const UseVideoTextureSceneSt = () => <UseVideoTextureScene />
UseVideoTextureSceneSt.story = {
  name: 'Default',
}
