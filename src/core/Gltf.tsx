import * as React from 'react'
import { GLTFLoader, DRACOLoader, MeshoptDecoder, GLTF } from 'three-stdlib'
import { ObjectMap, useLoader } from '@react-three/fiber'
import { Clone } from './Clone'

let dracoLoader: DRACOLoader | null = null
let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'

type Path = string | string[]
type UseDraco = boolean | string
type UseMeshOpt = boolean
type ExtendLoader = (loader: GLTFLoader) => void

function extensions(useDraco: UseDraco = true, useMeshopt: UseMeshOpt = true, extendLoader?: ExtendLoader) {
  return (loader: GLTFLoader) => {
    if (extendLoader) {
      extendLoader(loader)
    }
    if (useDraco) {
      if (!dracoLoader) {
        dracoLoader = new DRACOLoader()
      }
      dracoLoader.setDecoderPath(typeof useDraco === 'string' ? useDraco : decoderPath)
      loader.setDRACOLoader(dracoLoader)
    }
    if (useMeshopt) {
      loader.setMeshoptDecoder(typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder)
    }
  }
}

export const useGLTF = <T extends Path>(
  path: T,
  useDraco?: UseDraco,
  useMeshOpt?: UseMeshOpt,
  extendLoader?: ExtendLoader
): T extends any[] ? (GLTF & ObjectMap)[] : GLTF & ObjectMap =>
  useLoader(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))

useGLTF.preload = (path: Path, useDraco: UseDraco, useMeshOpt: UseMeshOpt, extendLoader?: ExtendLoader) =>
  useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshOpt, extendLoader))

useGLTF.clear = (path: Path) => useLoader.clear(GLTFLoader, path)
useGLTF.setDecoderPath = (path: string) => {
  decoderPath = path
}

//

type CloneProps = React.ComponentProps<typeof Clone>
type GltfRef = React.ElementRef<typeof Clone>

type GltfProps = Omit<CloneProps, 'object'> & {
  src: string // simple string, not a string[] as useGLTF supports (otherwise we should render multiple <Clone>s?)
  useDraco?: UseDraco
  useMeshOpt?: UseMeshOpt
  extendLoader?: ExtendLoader
}
export const Gltf = /* @__PURE__ */ React.forwardRef<GltfRef, GltfProps>(
  ({ src, useDraco, useMeshOpt, extendLoader, ...props }, ref) => {
    const { scene } = useGLTF(src, useDraco, useMeshOpt, extendLoader)

    return <Clone ref={ref} {...props} object={scene} />
  }
)
