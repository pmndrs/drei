import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

export function useTexture(url: string): Texture {
  return useLoader(TextureLoader, url)
}

export function useTextures(urls: string[]): Texture[] {
  return useLoader<Texture[]>(TextureLoader, urls)
}

useTexture.preload = (url: string) => useLoader.preload(TextureLoader, url)
useTextures.preload = (urls: string[]) => useLoader.preload<Texture[]>(TextureLoader, urls)
