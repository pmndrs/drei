import { useLoader, useThree } from '@react-three/fiber'
import {
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Loader,
  CubeReflectionMapping,
  CubeTexture,
  ColorSpace,
} from 'three'
import { RGBELoader, EXRLoader } from 'three-stdlib'
import { GainMapLoader, HDRJPGLoader } from '@monogrid/gainmap-js'
import { presetsObj, PresetsType } from '../helpers/environment-assets'
import { useLayoutEffect } from 'react'

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'
const isArray = (arr: any): arr is string[] => Array.isArray(arr)

export type EnvironmentLoaderProps = {
  files?: string | string[]
  path?: string
  preset?: PresetsType
  extensions?: (loader: Loader) => void
  colorSpace?: ColorSpace
}

const defaultFiles = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png']

export function useEnvironment({
  files = defaultFiles,
  path = '',
  preset = undefined,
  colorSpace = undefined,
  extensions,
}: Partial<EnvironmentLoaderProps> = {}) {
  if (preset) {
    validatePreset(preset)
    files = presetsObj[preset]
    path = CUBEMAP_ROOT
  }

  // Everything else
  const multiFile = isArray(files)

  const { extension, isCubemap } = getExtension(files)

  const loader = getLoader(extension)
  if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)

  const gl = useThree((state) => state.gl)

  useLayoutEffect(() => {
    // Only required for gainmap
    if (extension !== 'webp' && extension !== 'jpg' && extension !== 'jpeg') return

    function clearGainmapTexture() {
      useLoader.clear(loader!, (multiFile ? [files] : files) as string | string[] | string[][])
    }

    gl.domElement.addEventListener('webglcontextlost', clearGainmapTexture, { once: true })
  }, [files, gl.domElement])

  const loaderResult: Texture | Texture[] = useLoader(
    loader,
    (multiFile ? [files] : files) as string | string[] | string[][],
    (loader) => {
      // Gainmap requires a renderer
      if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
        // @ts-expect-error
        loader.setRenderer(gl)
      }
      loader.setPath?.(path)
      // @ts-expect-error
      if (extensions) extensions(loader)
    }
  ) as Texture | Texture[]
  let texture: Texture | CubeTexture = multiFile
    ? // @ts-ignore
      loaderResult[0]
    : loaderResult

  if (extension === 'jpg' || extension === 'jpeg' || extension === 'webp') {
    texture = (texture as any).renderTarget?.texture
  }

  texture.mapping = isCubemap ? CubeReflectionMapping : EquirectangularReflectionMapping

  texture.colorSpace = colorSpace ?? (isCubemap ? 'srgb' : 'srgb-linear')

  return texture
}

type EnvironmentLoaderPreloadOptions = Omit<EnvironmentLoaderProps, 'encoding'>
const preloadDefaultOptions = {
  files: defaultFiles,
  path: '',
  preset: undefined,
  extensions: undefined,
}

useEnvironment.preload = (preloadOptions?: EnvironmentLoaderPreloadOptions) => {
  const options = { ...preloadDefaultOptions, ...preloadOptions }
  let { files, path = '' } = options
  const { preset, extensions } = options

  if (preset) {
    validatePreset(preset)
    files = presetsObj[preset]
    path = CUBEMAP_ROOT
  }

  const { extension } = getExtension(files)

  if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
    throw new Error('useEnvironment: Preloading gainmaps is not supported')
  }

  const loader = getLoader(extension)
  if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)

  useLoader.preload(loader, isArray(files) ? [files] : files, (loader) => {
    loader.setPath?.(path)
    // @ts-expect-error
    if (extensions) extensions(loader)
  })
}

type EnvironmentLoaderClearOptions = Pick<EnvironmentLoaderProps, 'files' | 'preset'>
const clearDefaultOptins = {
  files: defaultFiles,
  preset: undefined,
}

useEnvironment.clear = (clearOptions?: EnvironmentLoaderClearOptions) => {
  const options = { ...clearDefaultOptins, ...clearOptions }
  let { files } = options
  const { preset } = options

  if (preset) {
    validatePreset(preset)
    files = presetsObj[preset]
  }

  const { extension } = getExtension(files)
  const loader = getLoader(extension)
  if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)
  useLoader.clear(loader, isArray(files) ? [files] : files)
}

function validatePreset(preset: string) {
  if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
}

function getExtension(files: string | string[]) {
  const isCubemap = isArray(files) && files.length === 6
  const isGainmap = isArray(files) && files.length === 3 && files.some((file) => file.endsWith('json'))
  const firstEntry = isArray(files) ? files[0] : files

  // Everything else
  const extension: string | false | undefined = isCubemap
    ? 'cube'
    : isGainmap
      ? 'webp'
      : firstEntry.startsWith('data:application/exr')
        ? 'exr'
        : firstEntry.startsWith('data:application/hdr')
          ? 'hdr'
          : firstEntry.startsWith('data:image/jpeg')
            ? 'jpg'
            : firstEntry.split('.').pop()?.split('?')?.shift()?.toLowerCase()

  return { extension, isCubemap, isGainmap }
}

function getLoader(extension: string | undefined) {
  const loader =
    extension === 'cube'
      ? CubeTextureLoader
      : extension === 'hdr'
        ? RGBELoader
        : extension === 'exr'
          ? EXRLoader
          : extension === 'jpg' || extension === 'jpeg'
            ? HDRJPGLoader
            : extension === 'webp'
              ? GainMapLoader
              : null

  return loader
}
