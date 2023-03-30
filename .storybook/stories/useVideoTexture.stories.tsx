import * as React from 'react'
import { useState } from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { Plane, useVideoTexture, useTexture } from '../../src'

export default {
  title: 'Misc/useVideoTexture',
  component: useVideoTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

//
// simple
//

function VideoTexturedPlane() {
  const texture = useVideoTexture('http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')

  return (
    <>
      <Plane args={[4, 2.25]}>
        <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />
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

//
// Suspense
//

function VideoTexturedPlane2() {
  return (
    <>
      <Plane args={[4, 2.25]}>
        <React.Suspense fallback={<FallbackMaterial url="images/sintel-cover.jpg" />}>
          <VideoMaterial src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4" />
        </React.Suspense>
      </Plane>
    </>
  )
}

function VideoMaterial({ src }) {
  const texture = useVideoTexture(src)
  return <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />
}

function FallbackMaterial({ url }: { url: string }) {
  const texture = useTexture(url)
  return <meshBasicMaterial map={texture} toneMapped={false} />
}

function UseVideoTextureScene2() {
  return (
    <React.Suspense fallback={null}>
      <VideoTexturedPlane2 />
    </React.Suspense>
  )
}

export const UseVideoTextureSceneSt2 = () => <UseVideoTextureScene2 />
UseVideoTextureSceneSt2.story = {
  name: 'Suspense',
}

//
// getDisplayMedia (Screen Capture API)
//

function VideoTexturedPlane3() {
  const [mediaStream, setMediaStream] = useState(new MediaStream())

  return (
    <>
      <Plane
        args={[4, 2.25]}
        onClick={async (e) => {
          const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
          setMediaStream(mediaStream)
        }}
      >
        <React.Suspense fallback={<FallbackMaterial url="images/share-screen.jpg" />}>
          <VideoMaterial src={mediaStream} />
        </React.Suspense>
      </Plane>
    </>
  )
}

function UseVideoTextureScene3() {
  return (
    <React.Suspense fallback={null}>
      <VideoTexturedPlane3 />
    </React.Suspense>
  )
}

export const UseVideoTextureSceneSt3 = () => <UseVideoTextureScene3 />
UseVideoTextureSceneSt3.story = {
  name: 'MediaStream',
}
