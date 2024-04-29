import { useLoader, useThree } from '@react-three/fiber'
import {
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Loader,
  CubeReflectionMapping,
  CubeTexture,
} from 'three'
import { RGBELoader, EXRLoader } from 'three-stdlib'
import { GainMapLoader, HDRJPGLoader } from '@monogrid/gainmap-js'
import { presetsObj, PresetsType } from '../helpers/environment-assets'
import { LinearEncoding, sRGBEncoding, TextureEncoding } from '../helpers/deprecated'

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'
const isArray = (arr: any): arr is string[] => Array.isArray(arr)

export type EnvironmentLoaderProps = {
  files?: string | string[]
  path?: string
  preset?: PresetsType
  extensions?: (loader: Loader) => void
  encoding?: TextureEncoding
}

export function useEnvironment({
  files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
  path = '',
  preset = undefined,
  encoding = undefined,
  extensions,
}: Partial<EnvironmentLoaderProps> = {}) {
  let loader: typeof Loader | null = null
  let multiFile: boolean = false

  if (preset) {
    if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    files = presetsObj[preset]
    path = CUBEMAP_ROOT
  }

  const isCubemap = isArray(files) && files.length === 6
  const isGainmap = isArray(files) && files.length === 3 && files.some((file) => file.endsWith('json'))
  const firstEntry = isArray(files) ? files[0] : files

  // Everything else
  multiFile = isArray(files)
  const extension = isCubemap
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
  loader =
    extension === 'cube'
      ? CubeTextureLoader
      : extension === 'hdr'
      ? RGBELoader
      : extension === 'exr'
      ? EXRLoader
      : extension === 'jpg' || extension === 'jpeg'
      ? (HDRJPGLoader as unknown as typeof Loader)
      : extension === 'webp'
      ? (GainMapLoader as unknown as typeof Loader)
      : null

  if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)

  const gl = useThree((state) => state.gl)
  const loaderResult: Texture | Texture[] = useLoader(
    // @ts-expect-error
    loader,
    multiFile ? [files] : files,
    (loader) => {
      // Gainmap requires a renderer
      if (extension === 'webp' || extension === 'jpg' || extension === 'jpeg') {
        // @ts-expect-error
        loader.setRenderer(gl)
      }
      loader.setPath?.(path)
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

  if ('colorSpace' in texture) (texture as any).colorSpace = encoding ?? isCubemap ? 'srgb' : 'srgb-linear'
  else (texture as any).encoding = encoding ?? isCubemap ? sRGBEncoding : LinearEncoding

  return texture
}
