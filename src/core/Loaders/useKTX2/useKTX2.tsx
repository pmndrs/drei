import * as React from 'react'
import { Texture } from '#three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
import { IsObject } from '../useTexture/useTexture'

const cdn = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master'

/**
 * Loads KTX2 compressed textures using THREE's KTX2Loader.
 *
 * @example Basic usage
 * ```jsx
 * const texture = useKTX2('/texture.ktx2')
 * return <meshBasicMaterial map={texture} />
 * ```
 */
export function useKTX2<Url extends string[] | string | Record<string, string>>(
  input: Url,
  basisPath: string = `${cdn}/basis/`
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const renderer = useThree((state) => state.renderer)
  const textures = useLoader(KTX2Loader, IsObject(input) ? Object.values(input) : (input as any), (loader: any) => {
    loader.detectSupport(renderer)
    loader.setTranscoderPath(basisPath)
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

useKTX2.preload = (url: string extends any[] ? string[] : string, basisPath: string = `${cdn}/basis/`) =>
  useLoader.preload(KTX2Loader, url, (loader: any) => {
    loader.setTranscoderPath(basisPath)
  })

useKTX2.clear = (input: string | string[]) => useLoader.clear(KTX2Loader, input)

//

/**
 * Declarative component for loading KTX2 textures.
 *
 * @example Basic usage
 * ```jsx
 * <Ktx2 input="/texture.ktx2">
 *   {(texture) => <meshBasicMaterial map={texture} />}
 * </Ktx2>
 * ```
 */
export const Ktx2 = ({
  children,
  input,
  basisPath,
}: {
  children?: (texture: ReturnType<typeof useKTX2>) => React.ReactNode
  input: Parameters<typeof useKTX2>[0]
  basisPath?: Parameters<typeof useKTX2>[1]
}) => {
  const texture = useKTX2(input, basisPath)

  return <>{children?.(texture)}</>
}
