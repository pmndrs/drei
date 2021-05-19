import { Texture, TextureLoader } from 'three'
import { useLoader } from '@react-three/fiber'

export const IsObject = (url: any): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Url
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const textures = useLoader(TextureLoader, IsObject(input) ? Object.values(input) : input as any)
  if (IsObject(input)) {
    const keys = Object.keys(input)
    const keyed = {} as any
    keys.forEach((key) => Object.assign(keyed, { [key]: textures[keys.indexOf(key)] }))
    return keyed
  } else return textures as any
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
