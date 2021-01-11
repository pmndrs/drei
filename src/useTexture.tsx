import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

export function useTexture(url: string): Texture
export function useTexture(url: string[]): Texture[]
export function useTexture(url: any): any {
  return useLoader(TextureLoader, url)
}

// useTexture.preload = <T extends string | string[]>(url: T) => useLoader.preload(TextureLoader, url)
