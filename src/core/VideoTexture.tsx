import * as React from 'react'
import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { type default as Hls, Events } from 'hls.js'

const IS_BROWSER =
  typeof window !== 'undefined' &&
  typeof window.document?.createElement === 'function' &&
  typeof window.navigator?.userAgent === 'string'

let _HLSModule: typeof import('hls.js') | null = null
async function getHls(...args: ConstructorParameters<typeof Hls>) {
  _HLSModule ??= await import('hls.js') // singleton
  const Ctor = _HLSModule.default
  if (Ctor.isSupported()) {
    return new Ctor(...args)
  }

  return null
}

export function useVideoTexture(
  srcOrSrcObject: HTMLVideoElement['src' | 'srcObject'],
  {
    unsuspend = 'loadedmetadata',
    start = true,
    hls: hlsConfig = {},
    crossOrigin = 'anonymous',
    muted = true,
    loop = true,
    ...videoProps
  }: {
    unsuspend?: keyof HTMLVideoElementEventMap
    start?: boolean
    hls?: Parameters<typeof getHls>[0]
  } & Partial<Omit<HTMLVideoElement, 'children' | 'src' | 'srcObject'>> = {}
) {
  const gl = useThree((state) => state.gl)
  const hlsRef = useRef<Hls | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const texture = suspend(
    () =>
      new Promise<THREE.VideoTexture>(async (res) => {
        let src: HTMLVideoElement['src'] | undefined = undefined
        let srcObject: HTMLVideoElement['srcObject'] | undefined = undefined
        if (typeof srcOrSrcObject === 'string') {
          src = srcOrSrcObject
        } else {
          srcObject = srcOrSrcObject
        }

        const video = Object.assign(document.createElement('video'), {
          src,
          srcObject,
          crossOrigin,
          loop,
          muted,
          ...videoProps,
        })
        videoRef.current = video

        // hlsjs extension
        if (src && IS_BROWSER && src.endsWith('.m3u8')) {
          const hls = (hlsRef.current = await getHls(hlsConfig))
          if (hls) {
            hls.on(Events.MEDIA_ATTACHED, () => void hls.loadSource(src))
            hls.attachMedia(video)
          }
        }

        const texture = new THREE.VideoTexture(video)

        if ('colorSpace' in texture) (texture as any).colorSpace = (gl as any).outputColorSpace
        else texture.encoding = gl.outputEncoding

        video.addEventListener(unsuspend, () => res(texture))
      }),
    [srcOrSrcObject]
  )

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

type UseVideoTexture = Parameters<typeof useVideoTexture>

export const VideoTexture = ({
  children,
  src,
  ...config
}: {
  children?: (texture: ReturnType<typeof useVideoTexture>) => React.ReactNode
  src: UseVideoTexture[0]
} & UseVideoTexture[1]) => {
  const ret = useVideoTexture(src, config)

  useEffect(() => {
    return () => void ret.dispose()
  }, [ret])

  return <>{children?.(ret)}</>
}
