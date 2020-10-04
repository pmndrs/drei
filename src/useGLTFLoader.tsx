import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useLoader } from 'react-three-fiber'

import { draco } from './draco'

export function useGLTFLoader(path: string, useDraco: boolean | string): GLTF {
  const gltf = useLoader<GLTF>(
    GLTFLoader,
    path,
    useDraco ? draco(typeof useDraco === 'string' ? useDraco : undefined) : undefined
  )
  return gltf
}

useGLTFLoader.preload = (path: string, useDraco: boolean | string) =>
  useLoader.preload(GLTFLoader, path, useDraco ? draco(typeof useDraco === 'string' ? useDraco : undefined) : undefined)
