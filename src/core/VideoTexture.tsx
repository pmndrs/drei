/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import * as THREE from 'three'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend, preload, peek, clear } from 'suspend-react'
import { type default as Hls, Events } from 'hls.js'

const IS_BROWSER = /* @__PURE__ */ (() =>
  typeof window !== 'undefined' &&
  typeof window.document?.createElement === 'function' &&
  typeof window.navigator?.userAgent === 'string')()

let _HLSModule: typeof import('hls.js') | null = null
async function getHls(...args: ConstructorParameters<typeof Hls>) {
  _HLSModule ??= await import('hls.js') // singleton
  const Ctor = _HLSModule.default
  if (Ctor.isSupported()) {
    return new Ctor(...args)
  }

  return null
}

// hls.js instances live as long as their cache entry: they are destroyed by `useVideoTexture.clear`
const hlsInstances = new WeakMap<HTMLVideoElement, Hls>()
function destroyHls(video: HTMLVideoElement) {
  hlsInstances.get(video)?.destroy()
  hlsInstances.delete(video)
}

async function createVideoTexture(
  srcOrSrcObject: HTMLVideoElement['src' | 'srcObject'],
  {
    unsuspend = 'loadedmetadata',
    start = true,
    hls: hlsConfig = {},
    crossOrigin = 'anonymous',
    muted = true,
    loop = true,
    playsInline = true,
    onVideoFrame,
    ...videoProps
  }: {
    /** Event name that will unsuspend the video */
    unsuspend?: keyof HTMLVideoElementEventMap
    /** Auto start the video once unsuspended */
    start?: boolean
    /** HLS config */
    hls?: Parameters<typeof getHls>[0]
    /**
     * request Video Frame Callback (rVFC)
     *
     * @see https://web.dev/requestvideoframecallback-rvfc/
     * @see https://www.remotion.dev/docs/video-manipulation
     * */
    onVideoFrame?: VideoFrameRequestCallback
  } & Partial<Omit<HTMLVideoElement, 'children' | 'src' | 'srcObject'>> = {}
) {
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
    playsInline,
    ...videoProps,
  })

  // hlsjs extension
  if (src && IS_BROWSER && src.endsWith('.m3u8')) {
    const hls = await getHls(hlsConfig)
    if (hls) {
      hls.on(Events.MEDIA_ATTACHED, () => void hls.loadSource(src))
      hls.attachMedia(video)
      hlsInstances.set(video, hls)
    }
  }

  const texture = new THREE.VideoTexture(video)

  texture.colorSpace = THREE.SRGBColorSpace // no renderer here: `useVideoTexture` sets `gl.outputColorSpace`

  await new Promise((res) => video.addEventListener(unsuspend, res, { once: true }))

  // cleared while pending: the cache no longer holds this texture
  setTimeout(() => {
    if (peek([srcOrSrcObject]) !== texture) destroyHls(video)
  })

  return texture
}

export type UseVideoTextureOptions = NonNullable<Parameters<typeof createVideoTexture>[1]>

export function useVideoTexture(
  srcOrSrcObject: HTMLVideoElement['src' | 'srcObject'],
  options: UseVideoTextureOptions = {}
) {
  const { start = true, onVideoFrame } = options
  const gl = useThree((state) => state.gl)

  const texture = suspend(() => createVideoTexture(srcOrSrcObject, options), [srcOrSrcObject])
  texture.colorSpace = gl.outputColorSpace

  const video = texture.source.data as HTMLVideoElement
  useVideoFrame(video, onVideoFrame)

  useEffect(() => {
    start && texture.image.play()
  }, [texture, start])

  return texture
}

/** Options only apply the first time a texture is created for a given src */
useVideoTexture.preload = (srcOrSrcObject: HTMLVideoElement['src' | 'srcObject'], options?: UseVideoTextureOptions) =>
  preload(() => createVideoTexture(srcOrSrcObject, options), [srcOrSrcObject])

useVideoTexture.clear = (srcOrSrcObject: HTMLVideoElement['src' | 'srcObject']) => {
  const texture = peek([srcOrSrcObject]) as THREE.VideoTexture | undefined
  if (texture) destroyHls(texture.image)
  clear([srcOrSrcObject])
}

//
// VideoTexture
//

type UseVideoTextureParams = Parameters<typeof useVideoTexture>
type VideoTexture = ReturnType<typeof useVideoTexture>

export type VideoTextureProps = {
  children?: (texture: VideoTexture) => React.ReactNode
  src: UseVideoTextureParams[0]
} & UseVideoTextureParams[1]

export const VideoTexture = /* @__PURE__ */ forwardRef<VideoTexture, VideoTextureProps>(
  ({ children, src, ...config }, fref) => {
    const texture = useVideoTexture(src, config)

    useEffect(() => {
      return () => void texture.dispose()
    }, [texture])

    useImperativeHandle(fref, () => texture, [texture]) // expose texture through ref

    return <>{children?.(texture)}</>
  }
)

// rVFC hook

const useVideoFrame = (video: HTMLVideoElement, f?: VideoFrameRequestCallback) => {
  useEffect(() => {
    if (!f) return
    if (!video.requestVideoFrameCallback) return

    let handle: ReturnType<(typeof video)['requestVideoFrameCallback']>
    const callback: VideoFrameRequestCallback = (...args) => {
      f(...args)
      handle = video.requestVideoFrameCallback(callback)
    }
    video.requestVideoFrameCallback(callback)

    return () => video.cancelVideoFrameCallback(handle)
  }, [video, f])
}
