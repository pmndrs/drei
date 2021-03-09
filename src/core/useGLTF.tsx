import { Loader } from 'three'
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { useLoader } from 'react-three-fiber'

function extensions(useDraco: boolean | string, useMeshopt: boolean) {
  return (loader: Loader) => {
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

export function useGLTF(path: string, useDraco: boolean | string = true, useMeshOpt: boolean = true) {
  const gltf = useLoader(GLTFLoader, path, extensions(useDraco, useMeshOpt))
  return gltf
}

useGLTF.preload = (path: string, useDraco: boolean | string = true, useMeshOpt: boolean = true) =>
  useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshOpt))
