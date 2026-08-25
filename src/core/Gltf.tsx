import * as React from 'react'
import { GLTFLoader, DRACOLoader, GLTF } from 'three-stdlib'
import { ObjectMap, useLoader } from '@react-three/fiber'
import { Clone, CloneProps } from './Clone'

let dracoLoader: DRACOLoader | null = null
let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'
let meshoptDecoder: MeshoptDecoder | null = null
let meshoptDecoderPromise: Promise<MeshoptDecoder> | null = null

type MeshoptDecoder = {
  supported: boolean
  ready: Promise<void>
  decodeGltfBuffer: (
    target: Uint8Array,
    count: number,
    size: number,
    source: Uint8Array,
    mode: string,
    filter?: string
  ) => void
  decodeGltfBufferAsync?: (
    count: number,
    size: number,
    source: Uint8Array,
    mode: string,
    filter?: string
  ) => Promise<Uint8Array>
}
type LazyMeshoptDecoder = Pick<MeshoptDecoder, 'supported' | 'ready' | 'decodeGltfBuffer' | 'decodeGltfBufferAsync'>
type DecodeGltfBufferParameters = Parameters<MeshoptDecoder['decodeGltfBuffer']>

function getMeshoptDecoder() {
  if (!meshoptDecoderPromise) {
    meshoptDecoderPromise = import('three/examples/jsm/libs/meshopt_decoder.module.js').then(({ MeshoptDecoder }) => {
      meshoptDecoder = MeshoptDecoder as MeshoptDecoder
      return meshoptDecoder
    })
  }

  return meshoptDecoderPromise
}

let lazyMeshoptDecoder: LazyMeshoptDecoder | null = null
function createLazyMeshoptDecoder(): LazyMeshoptDecoder {
  if (lazyMeshoptDecoder) return lazyMeshoptDecoder

  lazyMeshoptDecoder = {
    get supported() {
      return typeof WebAssembly === 'object' && (meshoptDecoder?.supported ?? true)
    },
    get ready() {
      return getMeshoptDecoder().then((decoder) => decoder.ready)
    },
    decodeGltfBuffer: (...args: DecodeGltfBufferParameters) => {
      if (!meshoptDecoder) {
        throw new Error('Drei: MeshoptDecoder is not ready. Use decodeGltfBufferAsync or await decoder.ready first.')
      }

      meshoptDecoder.decodeGltfBuffer(...args)
    },
    decodeGltfBufferAsync: async (count, size, source, mode, filter) => {
      const decoder = await getMeshoptDecoder()

      if (decoder.decodeGltfBufferAsync) {
        return decoder.decodeGltfBufferAsync(count, size, source, mode, filter)
      }

      await decoder.ready

      const result = new Uint8Array(count * size)
      decoder.decodeGltfBuffer(result, count, size, source, mode, filter)
      return result
    },
  }

  return lazyMeshoptDecoder
}

type Path = string | string[]
type UseDraco = boolean | string
type UseMeshopt = boolean
type ExtendLoader = (loader: GLTFLoader) => void

function extensions(useDraco: UseDraco = true, useMeshopt: UseMeshopt = true, extendLoader?: ExtendLoader) {
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
      loader.setMeshoptDecoder(createLazyMeshoptDecoder())
    }
  }
}

export const useGLTF = <T extends Path>(
  path: T,
  useDraco?: UseDraco,
  useMeshopt?: UseMeshopt,
  extendLoader?: ExtendLoader
): T extends any[] ? (GLTF & ObjectMap)[] : GLTF & ObjectMap =>
  useLoader(GLTFLoader, path, extensions(useDraco, useMeshopt, extendLoader))

useGLTF.preload = (path: Path, useDraco?: UseDraco, useMeshopt?: UseMeshopt, extendLoader?: ExtendLoader) =>
  useLoader.preload(GLTFLoader, path, extensions(useDraco, useMeshopt, extendLoader))

useGLTF.clear = (path: Path) => useLoader.clear(GLTFLoader, path)
useGLTF.setDecoderPath = (path: string) => {
  decoderPath = path
}

//

type GltfRef = React.ComponentRef<typeof Clone>

export type GltfProps = Omit<CloneProps, 'object'> & {
  src: string // simple string, not a string[] as useGLTF supports (otherwise we should render multiple <Clone>s?)
  useDraco?: UseDraco
  useMeshOpt?: UseMeshopt
  extendLoader?: ExtendLoader
}
export const Gltf = /* @__PURE__ */ React.forwardRef<GltfRef, GltfProps>(
  ({ src, useDraco, useMeshOpt, extendLoader, ...props }, ref) => {
    const { scene } = useGLTF(src, useDraco, useMeshOpt, extendLoader)

    return <Clone ref={ref} {...props} object={scene} />
  }
)
