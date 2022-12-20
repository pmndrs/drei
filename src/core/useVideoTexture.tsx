import * as THREE from 'three'
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend, preload, clear } from 'suspend-react'

interface VideoTextureProps extends HTMLVideoElement {
  unsuspend?: 'canplay' | 'canplaythrough' | 'loadstart' | 'loadedmetadata'
  start?: boolean
}

export function useVideoTexture(src: string, props: Partial<VideoTextureProps>) {
  const { unsuspend, start, crossOrigin, muted, loop, ...rest } = {
    unsuspend: 'loadedmetadata',
    crossOrigin: 'Anonymous',
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
    ...props,
  }
  const gl = useThree((state) => state.gl)
  const texture = suspend<[url: string], () => Promise<THREE.VideoTexture>>(
    () =>
      new Promise((res, rej) => {
        const video = Object.assign(document.createElement('video'), {
          src,
          crossOrigin,
          loop,
          muted,
          ...rest,
        })
        const texture = new THREE.VideoTexture(video)
        texture.encoding = gl.outputEncoding
        video.addEventListener(unsuspend, () => res(texture))
      }),
    [src]
  )
  useEffect(() => void (start && texture.image.play()), [texture, start])
  return texture
}
