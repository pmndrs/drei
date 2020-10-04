import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

export function useTexture(url: string extends any[] ? string[] : string): Texture | Texture[] {
  return useLoader(TextureLoader, url)
}

useTexture.preload = (url: string extends any[] ? string[] : string) => useLoader.preload(TextureLoader, url)
