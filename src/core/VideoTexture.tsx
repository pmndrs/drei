import * as React from 'react'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import type { HlsConfig, default as Hls } from 'hls.js'

type Config = {
  unsuspend?: 'canplay' | 'canplaythrough' | 'loadstart' | 'loadedmetadata'
  start?: boolean
  hls?: Partial<HlsConfig>
} & Partial<Omit<HTMLVideoElement, 'children'>>

const IS_BROWSER =
  typeof window !== 'undefined' &&
  typeof window.document?.createElement === 'function' &&
  typeof window.navigator?.userAgent === 'string'

let _HLSModule: typeof import('hls.js') | null = null
async function getHLS(url: URL, config: Partial<HlsConfig>): Promise<Hls | null> {
  if (IS_BROWSER && url.pathname.endsWith('.m3u8')) {
    _HLSModule ??= await import('hls.js')
    if (_HLSModule.default.isSupported()) {
      return new _HLSModule.default({ ...config })
    }
  }

  return null
}

export function useVideoTexture(
  src: string | MediaStream,
  {
    unsuspend = 'loadedmetadata',
    start = true,
    crossOrigin = 'anonymous',
    muted = true,
    loop = true,
    hls = {},
    ...videoProps
  }: Config = {}
) {
  const url = new URL(typeof src === 'string' ? src : '', window.location.href)
  const hlsRef = useRef<Hls | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const gl = useThree((state) => state.gl)

  const texture = suspend(
    () =>
      new Promise(async (res) => {
        const video = Object.assign(document.createElement('video'), {
          src: (typeof src === 'string' && src) || undefined,
          srcObject: (src instanceof MediaStream && src) || undefined,
          crossOrigin,
          loop,
          muted,
          ...videoProps,
        })
        videoRef.current = video

        // hlsjs extension
        if (typeof src === 'string') {
          const _hls = (hlsRef.current = await getHLS(url, hls))

          if (_hls) {
            _hls.attachMedia(video)
            _hls.on('hlsMediaAttached' as typeof Hls.Events.MEDIA_ATTACHED, () => {
              _hls.loadSource(src)
            })
          } else {
            video.src = src
          }
        } else if (src instanceof MediaStream) {
          video.srcObject = src
        }

        const texture = new THREE.VideoTexture(video)
        if ('colorSpace' in texture) (texture as any).colorSpace = (gl as any).outputColorSpace
        else texture.encoding = gl.outputEncoding

        video.addEventListener(unsuspend, () => res(texture))
      }),
    [src]
  ) as THREE.VideoTexture

  useEffect(() => {
    start && texture.image.play()

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [texture, start])

  return texture
}

//

export const VideoTexture = ({
  children,
  src,
  ...config
}: {
  children?: (texture: ReturnType<typeof useVideoTexture>) => React.ReactNode
  src: Parameters<typeof useVideoTexture>[0]
} & Parameters<typeof useVideoTexture>[1]) => {
  const ret = useVideoTexture(src, config)

  return <>{children?.(ret)}</>
}
