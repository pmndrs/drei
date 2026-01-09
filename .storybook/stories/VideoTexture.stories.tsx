import * as React from 'react'
import { useState } from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Plane, VideoTexture, useTexture } from '../../src'

export default {
  title: 'Misc/VideoTexture',
  component: VideoTexture,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof VideoTexture>

type Story = StoryObj<typeof VideoTexture>

function VideoTextureScene(props: React.ComponentProps<typeof VideoTexture>) {
  return (
    <VideoTexture {...props}>
      {(texture) => (
        <Plane args={[4, 2.25]}>
          <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />
        </Plane>
      )}
    </VideoTexture>
  )
}

export const VideoTextureSt = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  render: (args) => <VideoTextureScene {...args} />,
  name: 'Default',
} satisfies Story

//

function VideoTextureScene2(props: React.ComponentProps<typeof VideoTexture>) {
  return (
    <>
      <Plane args={[4, 2.25]}>
        <React.Suspense fallback={<FallbackMaterial url="images/sintel-cover.jpg" />}>
          <VideoTexture {...props}>
            {(texture) => <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />}
          </VideoTexture>
        </React.Suspense>
      </Plane>
    </>
  )
}

function FallbackMaterial({ url }: { url: string }) {
  const texture = useTexture(url)
  return <meshBasicMaterial map={texture} toneMapped={false} />
}

export const VideoTextureSt2 = {
  args: {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  render: (args) => <VideoTextureScene2 {...args} />,
  name: 'Suspense',
} satisfies Story

//

function VideoTextureScene3(props: React.ComponentProps<typeof VideoTexture>) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  return (
    <>
      <Plane
        args={[4, 2.25]}
        onClick={async () => {
          const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
          setMediaStream(mediaStream)
        }}
      >
        <React.Suspense fallback={<FallbackMaterial url="images/share-screen.jpg" />}>
          <VideoTexture {...props} src={mediaStream}>
            {(texture) => <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />}
          </VideoTexture>
        </React.Suspense>
      </Plane>
    </>
  )
}

export const UseVideoTextureSceneSt3 = {
  render: (args) => <VideoTextureScene3 {...args} />,
  name: 'MediaStream',
} satisfies Story

//

function VideoTextureScene4(props: React.ComponentProps<typeof VideoTexture>) {
  return (
    <>
      <Plane args={[4, 2.25]}>
        <VideoTexture {...props}>
          {(texture) => <meshBasicMaterial side={THREE.DoubleSide} map={texture} toneMapped={false} />}
        </VideoTexture>
      </Plane>
    </>
  )
}

export const VideoTextureSt4 = {
  args: {
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // m3u8 file from: https://hlsjs.video-dev.org/demo/
  },
  render: (args) => <VideoTextureScene4 {...args} />,
  name: 'hls▸js',
} satisfies Story
