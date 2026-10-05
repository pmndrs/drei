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

type VideoSrc = HTMLVideoElement['src' | 'srcObject']

/**
 * Options used to create the `<video>` element and its texture.
 *
 * NB: the cache key is the src only, so these options are only taken into account
 * the first time a texture is created for a given src.
 */
type VideoTextureOptions = {
  /** Event name that will unsuspend the video */
  unsuspend?: keyof HTMLVideoElementEventMap
  /** HLS config */
  hls?: Parameters<typeof getHls>[0]
} & Partial<Omit<HTMLVideoElement, 'children' | 'src' | 'srcObject'>>

type UseVideoTextureOptions = VideoTextureOptions & {
  /** Auto start the video once unsuspended */
  start?: boolean
  /**
   * request Video Frame Callback (rVFC)
   *
   * @see https://web.dev/requestvideoframecallback-rvfc/
   * @see https://www.remotion.dev/docs/video-manipulation
   * */
  onVideoFrame?: VideoFrameRequestCallback
}

/**
 * hls.js instances, one per `<video>` element created from an `.m3u8` src.
 *
 * Kept outside of any component, since a texture can be created by `useVideoTexture.preload`
 * before any component mounts. An instance lives as long as its cache entry, and is destroyed
 * by `useVideoTexture.clear`.
 */
const hlsInstances = new WeakMap<HTMLVideoElement, Hls>()

/**
 * Create a `<video>` element and its `THREE.VideoTexture`.
 *
 * Resolves once the `unsuspend` event fires on the video. No GPU upload happens here:
 * it only happens once the texture is rendered.
 */
async function createVideoTexture(
  srcOrSrcObject: VideoSrc,
  {
    unsuspend = 'loadedmetadata',
    hls: hlsConfig = {},
    crossOrigin = 'anonymous',
    muted = true,
    loop = true,
    playsInline = true,
    ...videoProps
  }: VideoTextureOptions = {}
): Promise<THREE.VideoTexture> {
  const src = typeof srcOrSrcObject === 'string' ? srcOrSrcObject : undefined
  const srcObject = typeof srcOrSrcObject === 'string' ? undefined : srcOrSrcObject

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

  // There is no renderer here (this may run from `useVideoTexture.preload`), so default to sRGB,
  // which is the renderer's default `outputColorSpace`. `useVideoTexture` matches the actual renderer.
  texture.colorSpace = THREE.SRGBColorSpace

  return new Promise((resolve) => {
    video.addEventListener(unsuspend, () => resolve(texture), { once: true })
  })
}

export function useVideoTexture(
  srcOrSrcObject: VideoSrc,
  { start = true, onVideoFrame, ...textureOptions }: UseVideoTextureOptions = {}
) {
  const gl = useThree((state) => state.gl)

  const texture = suspend(() => createVideoTexture(srcOrSrcObject, textureOptions), [srcOrSrcObject])

  // Match the renderer's output color space. This runs before the texture is first rendered,
  // and is a no-op with the default sRGB output color space.
  if (texture.colorSpace !== gl.outputColorSpace) {
    texture.colorSpace = gl.outputColorSpace
  }

  const video = texture.source.data as HTMLVideoElement
  useVideoFrame(video, onVideoFrame)

  useEffect(() => {
    start && texture.image.play()
  }, [texture, start])

  return texture
}

/**
 * Create the video texture ahead of time, eg. to start buffering the video (with `preload: 'auto'`)
 * before any component using it mounts. Same cache as `useVideoTexture`: options only apply the
 * first time a texture is created for a given src.
 */
useVideoTexture.preload = (srcOrSrcObject: VideoSrc, options?: VideoTextureOptions) =>
  preload(() => createVideoTexture(srcOrSrcObject, options), [srcOrSrcObject])

/**
 * Remove the video texture from the cache (and destroy its hls.js instance, if any).
 */
useVideoTexture.clear = (srcOrSrcObject: VideoSrc) => {
  const texture = peek([srcOrSrcObject]) as THREE.VideoTexture | undefined
  if (texture) {
    const video = texture.source.data as HTMLVideoElement
    hlsInstances.get(video)?.destroy()
    hlsInstances.delete(video)
  }

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
