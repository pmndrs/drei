import * as React from 'react'
import { Texture } from '#three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { IsObject } from '../useTexture/useTexture'

let transcoderPath: string = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master/basis/'

type ExtendLoader = (loader: KTX2Loader) => void

/**
 * Loads KTX2 compressed textures using THREE's KTX2Loader.
 *
 * @example Basic usage
 * ```jsx
 * const texture = useKTX2('/texture.ktx2')
 * return <meshBasicMaterial map={texture} />
 * ```
 *
 * @example With custom transcoder path
 * ```jsx
 * const texture = useKTX2('/texture.ktx2', '/basis/')
 * ```
 *
 * @example With loader customization
 * ```jsx
 * const texture = useKTX2('/texture.ktx2', true, (loader) => {
 *   loader.setWorkerLimit(4)
 * })
 * ```
 */
export function useKTX2<Url extends string[] | string | Record<string, string>>(
  input: Url,
  basisPath: boolean | string = true,
  extendLoader?: ExtendLoader
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const renderer = useThree((state) => state.renderer)
  const textures = useLoader(KTX2Loader, IsObject(input) ? Object.values(input) : (input as any), (loader) => {
    if (extendLoader) {
      extendLoader(loader)
    }
    if (basisPath) {
      loader.setTranscoderPath(typeof basisPath === 'string' ? basisPath : transcoderPath)
    }
    loader.detectSupport(renderer)
  })

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  useEffect(() => {
    const array = Array.isArray(textures) ? textures : [textures]
    array.forEach((texture) => renderer.initTexture(texture))
  }, [renderer, textures])

  if (IsObject(input)) {
    const keys = Object.keys(input)
    const keyed = {} as any
    keys.forEach((key) => Object.assign(keyed, { [key]: textures[keys.indexOf(key)] }))
    return keyed
  } else {
    return textures as any
  }
}

useKTX2.preload = (
  url: string extends any[] ? string[] : string,
  basisPath: boolean | string = true,
  extendLoader?: ExtendLoader
) =>
  useLoader.preload(KTX2Loader, url, (loader) => {
    if (extendLoader) {
      extendLoader(loader)
    }
    if (basisPath) {
      loader.setTranscoderPath(typeof basisPath === 'string' ? basisPath : transcoderPath)
    }
  })

useKTX2.clear = (input: string | string[]) => useLoader.clear(KTX2Loader, input)

useKTX2.setTranscoderPath = (path: string) => {
  transcoderPath = path
}

//

export type Ktx2Props = {
  /** Render function that receives the loaded texture(s) */
  children?: (texture: ReturnType<typeof useKTX2>) => React.ReactNode
  /** URL(s) or object of URLs to KTX2 textures */
  input: Parameters<typeof useKTX2>[0]
  /** Path to basis transcoder files, or false to skip setting path. @default true (uses CDN) */
  basisPath?: Parameters<typeof useKTX2>[1]
  /** Optional callback to customize the KTX2Loader instance */
  extendLoader?: ExtendLoader
}

/**
 * Declarative component for loading KTX2 textures.
 *
 * @example Basic usage
 * ```jsx
 * <Ktx2 input="/texture.ktx2">
 *   {(texture) => <meshBasicMaterial map={texture} />}
 * </Ktx2>
 * ```
 *
 * @example With custom transcoder path
 * ```jsx
 * <Ktx2 input="/texture.ktx2" basisPath="/basis/">
 *   {(texture) => <meshBasicMaterial map={texture} />}
 * </Ktx2>
 * ```
 *
 * @example With loader customization
 * ```jsx
 * <Ktx2 input="/texture.ktx2" extendLoader={(loader) => loader.setWorkerLimit(4)}>
 *   {(texture) => <meshBasicMaterial map={texture} />}
 * </Ktx2>
 * ```
 */
export const Ktx2 = ({ children, input, basisPath, extendLoader }: Ktx2Props) => {
  const texture = useKTX2(input, basisPath, extendLoader)

  return <>{children?.(texture)}</>
}
