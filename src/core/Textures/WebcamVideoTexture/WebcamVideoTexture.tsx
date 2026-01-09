import * as React from 'react'
import * as THREE from '#three'
import { forwardRef, useEffect } from 'react'
import { suspend, clear } from 'suspend-react'
import { VideoTexture, VideoTextureProps } from '../VideoTexture/VideoTexture'

export type WebcamVideoTextureProps = Omit<VideoTextureProps, 'src'> & {
  constraints?: MediaStreamConstraints
}

/**
 * Creates a video texture from webcam via getUserMedia API.
 *
 * @example Basic usage
 * ```jsx
 * <WebcamVideoTexture>
 *   {(texture) => <meshBasicMaterial map={texture} toneMapped={false} />}
 * </WebcamVideoTexture>
 * ```
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
