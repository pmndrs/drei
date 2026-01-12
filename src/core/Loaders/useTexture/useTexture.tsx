import * as React from 'react'
import { Texture as _Texture, TextureLoader } from '#three'
import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useEffect, useMemo } from 'react'

//* Types ==============================

type MappedTextureType<T extends string | string[] | Record<string, string>> = T extends string[]
  ? _Texture[]
  : T extends Record<string, string>
    ? { [K in keyof T]: _Texture }
    : _Texture

export const IsObject = (url: unknown): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

/**
 * Loads textures using THREE's TextureLoader with suspense support.
 *
 * @example Single texture
 * ```jsx
 * const texture = useTexture('/texture.png')
 * ```
 *
 * @example Multiple textures
 * ```jsx
 * const [colorMap, normalMap] = useTexture(['/color.png', '/normal.png'])
 * ```
 */
export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Url,
  onLoad?: (texture: MappedTextureType<Url>) => void
): MappedTextureType<Url> {
  const gl = useThree((state) => state.gl)
  const textures = useLoader(TextureLoader, IsObject(input) ? Object.values(input) : input) as MappedTextureType<Url>

  useLayoutEffect(() => {
    onLoad?.(textures)
  }, [onLoad])

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  // NOTE: only available for WebGLRenderer
  useEffect(() => {
    if ('initTexture' in gl) {
      let textureArray: _Texture[] = []
      if (Array.isArray(textures)) {
        textureArray = textures
      } else if ((textures as _Texture).isTexture) {
        textureArray = [textures as _Texture]
      } else if (IsObject(textures)) {
        textureArray = Object.values(textures) as unknown as _Texture[]
      }

      textureArray.forEach((texture) => {
        if (texture instanceof _Texture) {
          gl.initTexture(texture)
        }
      })
    }
  }, [gl, textures])

  const mappedTextures = useMemo(() => {
    if (IsObject(input)) {
      const keyed = {} as MappedTextureType<Url>
      let i = 0
      for (const key in input) keyed[key] = textures[i++]
      return keyed
    } else {
      return textures
    }
  }, [input, textures])

  return mappedTextures
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
