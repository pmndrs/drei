import { Texture, TextureLoader } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useEffect } from 'react'

export const IsObject = (url: any): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

export type MappedTextureType<T> = T extends any[]
  ? Texture[]
  : T extends object
  ? { [key in keyof T]: Texture }
  : Texture

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
      const array = Array.isArray(textures) ? textures : [textures]
      array.forEach(gl.initTexture)
    }
  }, [gl, textures])

  if (IsObject(input)) {
    const keyed = {} as MappedTextureType<Url>
    let i = 0
    for (const key in input) keyed[key] = textures[i++]
    return keyed
  } else {
    return textures
  }
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)
