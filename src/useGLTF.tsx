import { Loader } from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { useLoader } from 'react-three-fiber'

function draco(url: string = 'https://www.gstatic.com/draco/v1/decoders/') {
  return (loader: Loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(url)
    ;(loader as GLTFLoader).setDRACOLoader(dracoLoader)
  }
}

export function useGLTF(path: string, useDraco: boolean | string = true): GLTF {
  const gltf = useLoader<GLTF>(
    GLTFLoader,
    path,
    useDraco ? draco(typeof useDraco === 'string' ? useDraco : undefined) : undefined
  )
  return gltf
}

useGLTF.preload = (path: string, useDraco: boolean | string = true) =>
  useLoader.preload(GLTFLoader, path, useDraco ? draco(typeof useDraco === 'string' ? useDraco : undefined) : undefined)
