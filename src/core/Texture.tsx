/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { Texture as _Texture, TextureLoader } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'

type Composite<T> = T | T[] | Record<string, T>

type Input = Composite<string>
type Output = Composite<_Texture>

// @deprecated: no more used
export const IsObject = (url: unknown): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

// @deprecated: use ReturnType<typeof useTexture> instead
export type MappedTextureType<T extends Input> = Output
export function useTexture(input: Input, onLoad?: (texture: Output) => void) {
  const gl = useThree((state) => state.gl)

  const strOrArr = Array.isArray(input) || typeof input === 'string'

  const textures = useLoader(TextureLoader, strOrArr ? input : Object.values(input))

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  // NOTE: only available for WebGLRenderer
  useEffect(() => {
    if ('initTexture' in gl) {
      if (Array.isArray(textures)) {
        for (const texture of textures) gl.initTexture(texture)
      } else {
        gl.initTexture(textures)
      }
    }
  }, [gl, textures])

  const compositeTextures = useMemo(() => {
    if (strOrArr) {
      return textures
    } else {
      const keyed = {} as Record<string, _Texture> // remap the `textures` to their `input` keys
      let i = 0
      for (const key in input) keyed[key] = textures[i++]
      return keyed
    }
  }, [input, strOrArr, textures])

  useLayoutEffect(() => {
    onLoad?.(compositeTextures)
  }, [compositeTextures, onLoad])

  return compositeTextures
}

useTexture.preload = (url: string | string[]) => useLoader.preload(TextureLoader, url)
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)

//

export const Texture = ({
  children,
  input,
  onLoad,
}: {
  children?: (texture: ReturnType<typeof useTexture>) => React.ReactNode
  input: Parameters<typeof useTexture>[0]
  onLoad?: Parameters<typeof useTexture>[1]
}) => {
  const ret = useTexture(input, onLoad)

  return <>{children?.(ret)}</>
}
