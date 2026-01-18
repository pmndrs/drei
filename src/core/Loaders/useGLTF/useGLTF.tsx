import * as React from 'react'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

import { ObjectMap, useLoader } from '@react-three/fiber'
import { Clone, CloneProps } from '../../Helpers/Clone/Clone'

let dracoLoader: DRACOLoader | null = null
let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'

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
      // MeshoptDecoder may be a function or an object depending on build
      const decoder = typeof MeshoptDecoder === 'function' ? (MeshoptDecoder as () => unknown)() : MeshoptDecoder
      loader.setMeshoptDecoder(decoder as typeof MeshoptDecoder)
    }
  }
}

/**
 * Loads GLTF files with optional Draco/Meshopt compression support.
 * Returns the loaded GLTF with all nodes, materials, and animations mapped.
 *
 * @example Basic usage
 * ```jsx
 * const { scene, nodes, materials } = useGLTF('/model.glb')
 * return <primitive object={scene} />
 * ```
 *
 * @example With Draco compression
 * ```jsx
 * const { scene } = useGLTF('/model.glb', true)
 * ```
 *
 * @example Preloading
 * ```jsx
 * useGLTF.preload('/model.glb')
 * ```
 */
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

/**
 * Declarative GLTF component that loads and renders a GLTF model.
 *
 * @example Basic usage
 * ```jsx
 * <Gltf src="/model.glb" />
 * ```
 */
export const Gltf = /* @__PURE__ */ React.forwardRef<GltfRef, GltfProps>(
  ({ src, useDraco, useMeshOpt, extendLoader, ...props }, ref) => {
    // src is a single string, so result is always GLTF & ObjectMap (not array)
    const { scene } = useGLTF(src, useDraco, useMeshOpt, extendLoader) as GLTF & ObjectMap

    return <Clone ref={ref} {...props} object={scene} />
  }
)
