import { Texture, TextureLoader } from 'three'
import { useLoader } from 'react-three-fiber'

type Path = Texture | Texture[]

export function useTextureLoader(path: Path): Texture {
  return useLoader<Texture>(TextureLoader, path)
}
