import { Texture, TextureLoader } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export const IsObject = (url: any): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

type Opts = {
  init: boolean
}

export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Url,
  { init }: Opts = { init: true }
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const gl = useThree((state) => state.gl)
  const textures = useLoader(TextureLoader, IsObject(input) ? Object.values(input) : (input as any))

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  useEffect(() => {
    if (init) {
      const array = Array.isArray(textures) ? textures : [textures]
      array.forEach(gl.initTexture)
    }
  }, [gl, textures, init])

  if (IsObject(input)) {
    const keys = Object.keys(input)
    const keyed = {} as any
    keys.forEach((key) => Object.assign(keyed, { [key]: textures[keys.indexOf(key)] }))
    return keyed
  } else {
    return textures as any
  }
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
// @ts-expect-error new in r3f 7.0.5
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)
