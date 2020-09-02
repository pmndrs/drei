import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

export function useTextureLoader(url: string): Texture;
export function useTextureLoader(urls: string[]): Texture[];

export function useTextureLoader(urls: string | string[]): Texture | Texture[] {
  return useLoader(TextureLoader, urls)
}
