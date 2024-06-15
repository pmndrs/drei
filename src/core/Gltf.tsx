import * as React from 'react'

import { Clone } from './Clone'
import { type Loader } from 'three'
import { type GLTF, GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib'
import { type ObjectMap, useLoader } from '@react-three/fiber'

let dracoLoader: DRACOLoader | null = null

let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'

function extensions(useDraco: boolean | string, useMeshopt: boolean, extendLoader?: (loader: GLTFLoader) => void) {
  return (loader: Loader) => {
    if (extendLoader) {
      extendLoader(loader as GLTFLoader)
    }
    if (useDraco) {
      if (!dracoLoader) {
        dracoLoader = new DRACOLoader()
      }
      dracoLoader.setDecoderPath(typeof useDraco === 'string' ? useDraco : decoderPath)
      ;(loader as GLTFLoader).setDRACOLoader(dracoLoader)
    }
    if (useMeshopt) {
      ;(loader as GLTFLoader).setMeshoptDecoder(
        typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder
      )
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

//

type UseGLTF = Parameters<typeof useGLTF>
type CloneProps = React.ComponentProps<typeof Clone>

type GltfRef = React.ElementRef<typeof Clone>

type GltfProps = Omit<CloneProps, 'object'> & {
  src: string // simple string, not a string[] as useGLTF supports (otherwise we should render multiple <Clone>s?)
  useDraco?: UseGLTF[1]
  useMeshOpt?: UseGLTF[2]
  extendLoader?: UseGLTF[3]
}
export const Gltf = /* @__PURE__ */ React.forwardRef<GltfRef, GltfProps>(
  ({ src, useDraco, useMeshOpt, extendLoader, ...props }, ref) => {
    const { scene } = useGLTF(src, useDraco, useMeshOpt, extendLoader)

    return <Clone ref={ref} {...props} object={scene} />
  }
)
