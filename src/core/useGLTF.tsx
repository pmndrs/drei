import { Loader } from 'three'
// @ts-ignore
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'

function extensions(useDraco: boolean | string, useMeshopt: boolean, extendLoader?: (loader: Loader) => void) {
  return (loader: Loader) => {
    if (extendLoader) {
      extendLoader(loader)
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

export function useGLTF(
  path: string,
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: Loader) => void
) {
  const gltf = useLoader(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))
  return gltf
}

useGLTF.preload = (
  path: string,
  useDraco: boolean | string = true,
  useMeshOpt: boolean = true,
  extendLoader?: (loader: Loader) => void
) => useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))
