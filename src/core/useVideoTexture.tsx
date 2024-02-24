import * as THREE from 'three'
import { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import Hls, { HlsConfig } from 'hls.js'

interface VideoTextureProps extends HTMLVideoElement {
  unsuspend?: 'canplay' | 'canplaythrough' | 'loadstart' | 'loadedmetadata'
  start?: boolean
}

interface HLSConfiguration {
  hls: HlsConfig
}

export function useVideoTexture(src: string | MediaStream, props?: Partial<VideoTextureProps | HLSConfiguration>) {
  const { unsuspend, start, crossOrigin, muted, loop, hls, ...rest } = {
    unsuspend: 'loadedmetadata',
    crossOrigin: 'Anonymous',
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
    hls: {},
    ...props,
  }
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gl = useThree((state) => state.gl)

  const createHLSBinding = useCallback(() => {
    if (videoRef.current && typeof src === 'string') {
      var video: HTMLVideoElement = videoRef.current
      const _hls = new Hls({ ...hls })
      _hls.attachMedia(video)
      _hls.loadSource(src)
    }
  }, [])

  const texture = suspend(
    () =>
      new Promise((res, rej) => {
        const video = Object.assign(document.createElement('video'), {
          src: (typeof src === 'string' && src) || undefined,
          srcObject: (src instanceof MediaStream && src) || undefined,
          crossOrigin,
          loop,
          muted,
          ...rest,
        })
        videoRef.current = video

        // hlsjs extension
        if (typeof src === 'string') {
          const url = new URL(src, window.location.href)

          if (url.pathname.endsWith('.m3u8') && Hls.isSupported()) {
            createHLSBinding()
          }

          // hls.js is not supported on platforms that do not have Media Source Extensions (MSE) enabled.
          // When the browser has built-in HLS support (check using `canPlayType`), we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video element through the `src` property.
          // This is using the built-in support of the plain video element, without using hls.js
        }

        const texture = new THREE.VideoTexture(video)
        if ('colorSpace' in texture) (texture as any).colorSpace = (gl as any).outputColorSpace
        else texture.encoding = gl.outputEncoding

        video.addEventListener(unsuspend, () => res(texture))
      }),
    [src]
  ) as THREE.VideoTexture
  useEffect(() => {
    if (start) {
      texture.image.play()
      return () => texture.image.pause()
    }
  }, [texture, start])
  return texture
}
