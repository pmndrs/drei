import { CubeTextureLoader, CubeTexture } from 'three'
import { useLoader } from '@react-three/fiber'

type Options = {
  path: string
}

export function useCubeTexture(files: string[], { path }: Options): CubeTexture {
  // @ts-expect-error
  const [cubeTexture] = useLoader(CubeTextureLoader, [files], (loader: CubeTextureLoader) => loader.setPath(path))
  return cubeTexture
}

useCubeTexture.preload = (files: string[], { path }: Options) =>
  // @ts-expect-error
  useLoader.preload(CubeTextureLoader, [files], (loader: CubeTextureLoader) => loader.setPath(path))
