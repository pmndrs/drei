import * as React from 'react'
import { useLayoutEffect } from 'react'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'

import { ObjectMap, useLoader, useThree } from '@react-three/fiber'
import { Clone, CloneProps } from '../../Helpers/Clone/Clone'
import { KTX2LoaderService } from '@utils/KTX2LoaderService'

let dracoLoader: DRACOLoader | null = null
let decoderPath: string = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/'
let legacyApiWarned = false

type Path = string | string[]
type UseDraco = boolean | string
type UseMeshopt = boolean
type UseKTX2 = boolean | string
type ExtendLoader = (loader: GLTFLoader) => void

/**
 * Options for useGLTF hook.
 */
export interface UseGLTFOptions {
  /** Enable Draco compression. Pass true for default CDN, or string for custom decoder path. @default true */
  draco?: UseDraco
  /** Enable Meshopt compression. @default true */
  meshopt?: UseMeshopt
  /** Enable KTX2 texture support. Pass true for default CDN, or string for custom transcoder path. @default false */
  ktx2?: UseKTX2
  /** Callback to customize the GLTFLoader instance */
  extendLoader?: ExtendLoader
}

// Type guard to detect options object vs legacy positional args
function isOptionsObject(arg: unknown): arg is UseGLTFOptions {
  return typeof arg === 'object' && arg !== null && !Array.isArray(arg)
}

// Emit deprecation warning once
function warnLegacyApi() {
  if (!legacyApiWarned) {
    legacyApiWarned = true
    console.warn(
      'useGLTF: Boolean arguments are deprecated. Use options object instead:\n' +
        '  useGLTF(path, { draco: true, meshopt: true, ktx2: true })'
    )
  }
}

function extensions(
  useDraco: UseDraco = true,
  useMeshopt: UseMeshopt = true,
  useKTX2: UseKTX2 = false,
  extendLoader?: ExtendLoader,
  renderer?: any
) {
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
    if (useKTX2) {
      const ktx2Loader = KTX2LoaderService.getLoader()

      // Set custom transcoder path if provided as string
      if (typeof useKTX2 === 'string') {
        ktx2Loader.setTranscoderPath(useKTX2)
      }

      // If renderer is available, ensure detectSupport is called
      if (renderer) {
        ktx2Loader.detectSupport(renderer)
      }

      loader.setKTX2Loader(ktx2Loader)
    }
  }
}

/**
 * Loads GLTF files with optional Draco/Meshopt/KTX2 compression support.
 * Returns the loaded GLTF with all nodes, materials, and animations mapped.
 *
 * @example Basic usage
 * ```jsx
 * const { scene, nodes, materials } = useGLTF('/model.glb')
 * return <primitive object={scene} />
 * ```
 *
 * @example With options (recommended)
 * ```jsx
 * const { scene } = useGLTF('/model.glb', { draco: true, ktx2: true })
 * ```
 *
 * @example With KTX2 textures and custom transcoder path
 * ```jsx
 * const { scene } = useGLTF('/model.glb', { ktx2: '/custom/basis/' })
 * ```
 *
 * @example Preloading
 * ```jsx
 * useGLTF.preload('/model.glb', { ktx2: true })
 * ```
 */
export function useGLTF<T extends Path>(
  path: T,
  optionsOrDraco?: UseGLTFOptions | UseDraco,
  useMeshoptArg?: UseMeshopt,
  useKTX2Arg?: UseKTX2,
  extendLoaderArg?: ExtendLoader
): T extends any[] ? (GLTF & ObjectMap)[] : GLTF & ObjectMap {
  // Parse arguments: support both options object and legacy positional args
  let draco: UseDraco = true
  let meshopt: UseMeshopt = true
  let ktx2: UseKTX2 = false
  let extendLoader: ExtendLoader | undefined

  if (isOptionsObject(optionsOrDraco)) {
    // New options object API
    draco = optionsOrDraco.draco ?? true
    meshopt = optionsOrDraco.meshopt ?? true
    ktx2 = optionsOrDraco.ktx2 ?? false
    extendLoader = optionsOrDraco.extendLoader
  } else if (optionsOrDraco !== undefined) {
    // Legacy positional API - emit deprecation warning
    warnLegacyApi()
    draco = optionsOrDraco
    meshopt = useMeshoptArg ?? true
    ktx2 = useKTX2Arg ?? false
    extendLoader = extendLoaderArg
  }

  const renderer = useThree((state) => state.renderer)

  // Register renderer with KTX2 service when KTX2 is enabled
  useLayoutEffect(() => {
    if (ktx2) {
      KTX2LoaderService.registerRenderer(renderer)
    }
  }, [ktx2, renderer])

  return useLoader(GLTFLoader, path, extensions(draco, meshopt, ktx2, extendLoader, ktx2 ? renderer : undefined))
}

useGLTF.preload = (
  path: Path,
  optionsOrDraco?: UseGLTFOptions | UseDraco,
  useMeshoptArg?: UseMeshopt,
  useKTX2Arg?: UseKTX2,
  extendLoaderArg?: ExtendLoader
) => {
  // Parse arguments: support both options object and legacy positional args
  let draco: UseDraco = true
  let meshopt: UseMeshopt = true
  let ktx2: UseKTX2 = false
  let extendLoader: ExtendLoader | undefined

  if (isOptionsObject(optionsOrDraco)) {
    // New options object API
    draco = optionsOrDraco.draco ?? true
    meshopt = optionsOrDraco.meshopt ?? true
    ktx2 = optionsOrDraco.ktx2 ?? false
    extendLoader = optionsOrDraco.extendLoader
  } else if (optionsOrDraco !== undefined) {
    // Legacy positional API - emit deprecation warning
    warnLegacyApi()
    draco = optionsOrDraco
    meshopt = useMeshoptArg ?? true
    ktx2 = useKTX2Arg ?? false
    extendLoader = extendLoaderArg
  }

  // For KTX2, we need to defer the actual preload until renderer is available
  if (ktx2) {
    KTX2LoaderService.onReady(() => {
      const renderer = KTX2LoaderService.getRenderer()
      useLoader.preload(GLTFLoader, path, extensions(draco, meshopt, ktx2, extendLoader, renderer))
    })
  } else {
    // No KTX2 - preload immediately
    useLoader.preload(GLTFLoader, path, extensions(draco, meshopt, false, extendLoader))
  }
}

useGLTF.clear = (path: Path) => useLoader.clear(GLTFLoader, path)

useGLTF.setDecoderPath = (path: string) => {
  decoderPath = path
}

useGLTF.setKTX2TranscoderPath = (path: string) => {
  KTX2LoaderService.setTranscoderPath(path)
}

//

type GltfRef = React.ComponentRef<typeof Clone>

export type GltfProps = Omit<CloneProps, 'object'> & {
  src: string // simple string, not a string[] as useGLTF supports (otherwise we should render multiple <Clone>s?)
  /** @deprecated Use options prop instead */
  useDraco?: UseDraco
  /** @deprecated Use options prop instead */
  useMeshOpt?: UseMeshopt
  /** @deprecated Use options prop instead */
  extendLoader?: ExtendLoader
  /** Options for GLTF loading */
  options?: UseGLTFOptions
}

/**
 * Declarative GLTF component that loads and renders a GLTF model.
 *
 * @example Basic usage
 * ```jsx
 * <Gltf src="/model.glb" />
 * ```
 *
 * @example With options
 * ```jsx
 * <Gltf src="/model.glb" options={{ ktx2: true }} />
 * ```
 */
export const Gltf = /* @__PURE__ */ React.forwardRef<GltfRef, GltfProps>(
  ({ src, useDraco, useMeshOpt, extendLoader, options, ...props }, ref) => {
    // Prefer options prop, fall back to legacy props
    const opts: UseGLTFOptions = options ?? {
      draco: useDraco,
      meshopt: useMeshOpt,
      extendLoader,
    }

    // src is a single string, so result is always GLTF & ObjectMap (not array)
    const { scene } = useGLTF(src, opts) as GLTF & ObjectMap

    return <Clone ref={ref} {...props} object={scene} />
  }
)
