import * as React from 'react'
import { forwardRef, useEffect } from 'react'
import { suspend, clear } from 'suspend-react'
import { VideoTexture, VideoTextureProps } from './VideoTexture'

export type WebcamVideoTextureProps = Omit<VideoTextureProps, 'src'> & {
  constraints?: MediaStreamConstraints
}

/**
 * Create a video texture from [`getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
 */
export const WebcamVideoTexture = /* @__PURE__ */ forwardRef<THREE.VideoTexture, WebcamVideoTextureProps>(
  (
    {
      constraints = {
        audio: false,
        video: { facingMode: 'user' },
      },
      ...props
    },
    fref
  ) => {
    const mediaStream = suspend(() => navigator.mediaDevices.getUserMedia(constraints), [])

    useEffect(() => {
      return () => {
        mediaStream?.getTracks().forEach((track) => track.stop())
        clear([])
      }
    }, [mediaStream])

    return <VideoTexture ref={fref} {...props} src={mediaStream} />
  }
)
