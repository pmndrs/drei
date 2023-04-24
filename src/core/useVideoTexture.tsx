import * as THREE from 'three'
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { suspend, preload, clear } from 'suspend-react'

interface VideoTextureProps extends HTMLVideoElement {
  unsuspend?: 'canplay' | 'canplaythrough' | 'loadstart' | 'loadedmetadata'
  start?: boolean
}

export function useVideoTexture(src: string | MediaStream, props?: Partial<VideoTextureProps>) {
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
        const texture = new THREE.VideoTexture(video)
        if ('colorSpace' in texture) (texture as any).colorSpace = (gl as any).outputColorSpace
        else texture.encoding = gl.outputEncoding

        video.addEventListener(unsuspend, () => res(texture))
      }),
    [src]
  ) as THREE.VideoTexture
  useEffect(() => void (start && texture.image.play()), [texture, start])
  return texture
}
