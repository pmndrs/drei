import * as React from 'react'
import * as THREE from 'three'
import { forwardRef, useEffect } from 'react'
import { suspend, clear } from 'suspend-react'
import { VideoTexture, VideoTextureProps } from '..'

export type ScreenVideoTextureProps = Omit<VideoTextureProps, 'src'> & {
  options?: DisplayMediaStreamOptions
}

/**
 * Create a video texture from [`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)
 */
export const ScreenVideoTexture = /* @__PURE__ */ forwardRef<THREE.VideoTexture, ScreenVideoTextureProps>(
  ({ options = { video: true }, ...props }, fref) => {
    const mediaStream = suspend(() => navigator.mediaDevices.getDisplayMedia(options), [])

    useEffect(() => {
      return () => {
        mediaStream?.getTracks().forEach((track) => track.stop())
        clear([])
      }
    }, [mediaStream])

    return <VideoTexture ref={fref} {...props} src={mediaStream} />
  }
)
