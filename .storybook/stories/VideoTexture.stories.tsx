import * as React from 'react'

import { Setup } from '../Setup'

import { Plane, VideoTexture } from '../../src'

export default {
  title: 'abstractions/VideoTexture',
  component: VideoTexture,
  decorators: [(storyFn) => <Setup cameraPosition={[0, 0, 20]}>{storyFn()}</Setup>],
}

function TexturedMeshes() {
  const videoRef = React.useRef<HTMLVideoElement>(null)

  console.log(videoRef)

  return (
    <>
      <Plane args={[16, 9]}>
        <meshBasicMaterial toneMapped={false}>
          <VideoTexture videoRef={videoRef} attach="map" src="smolvideo.mp4" autoPlay muted />
        </meshBasicMaterial>
      </Plane>
    </>
  )
}

function UseTextureScene() {
  return (
    <React.Suspense fallback={null}>
      <TexturedMeshes />
    </React.Suspense>
  )
}

export const UseTextureSceneSt = () => <UseTextureScene />
UseTextureSceneSt.story = {
  name: 'Default',
}
