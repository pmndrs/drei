import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

export function useTexture<Url extends string[] | string>(url: Url): Url extends any[] ? Texture[] : Texture {
  return useLoader(TextureLoader, url)
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
