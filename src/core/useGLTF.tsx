import { Loader } from 'three'
// @ts-ignore
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'

function extensions(useDraco: boolean | string, useMeshopt: boolean, extendLoader?: (loader: GLTFLoader) => void) {
  return (loader: Loader) => {
    if (extendLoader) {
      extendLoader(loader as GLTFLoader)
    }
    if (useDraco) {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath(typeof useDraco === 'string' ? useDraco : 'https://www.gstatic.com/draco/v1/decoders/')
      ;(loader as GLTFLoader).setDRACOLoader(dracoLoader)
    }
    if (useMeshopt) {
      ;(loader as GLTFLoader).setMeshoptDecoder(MeshoptDecoder)
    }
  }
}

export function useGLTF<T extends string | string[]>(
  path: T,
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) {
  const gltf = useLoader(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))
  return gltf
}

useGLTF.preload = (
  path: string | string[],
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: GLTFLoader) => void
) => useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))

// @ts-expect-error new in r3f 7.0.5
useGLTF.clear = (input: string | string[]) => useLoader.clear(GLTFLoader, input)
