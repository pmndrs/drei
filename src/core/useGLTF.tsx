import { type Loader } from 'three'
import { type GLTF, GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { type ObjectMap, useLoader } from '@react-three/fiber'

let dracoLoader: DRACOLoader | null = null

let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'
type DracoLoaderOption = boolean | string

const setupDracoLoader = (useDraco: DracoLoaderOption) => {
  if (!dracoLoader) dracoLoader = new DRACOLoader()
  const path = typeof useDraco === 'string' ? useDraco : decoderPath
  dracoLoader.setDecoderPath(path)
  return dracoLoader
}

const setupMeshoptDecoder = () => {
  return typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder
}

function extensions(useDraco: DracoLoaderOption, useMeshopt: boolean, extendLoader?: (loader: GLTFLoader) => void) {
  return (loader: Loader) => {
    if (extendLoader) {
      extendLoader(loader as GLTFLoader)
    }
    if (useDraco) {
      const dracoLoader = setupDracoLoader(useDraco)
      ;(loader as GLTFLoader).setDRACOLoader(dracoLoader)
    }
    if (useMeshopt) {
      const meshoptDecoder = setupMeshoptDecoder()
      ;(loader as GLTFLoader).setMeshoptDecoder(meshoptDecoder)
    }
  }
}

export function useGLTF<T extends string | string[]>(
  path: T,
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
): T extends any[] ? (GLTF & ObjectMap)[] : GLTF & ObjectMap {
  return useLoader(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))
}

useGLTF.preload = (
  path: string | string[],
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) => useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))

useGLTF.clear = (input: string | string[]) => useLoader.clear(GLTFLoader, input)
useGLTF.setDecoderPath = (path: string) => {
  decoderPath = path
}
