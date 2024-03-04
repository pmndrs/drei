import { useLoader } from '@react-three/fiber'
import {
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Loader,
  CubeReflectionMapping,
  CubeTexture,
} from 'three'
import { RGBELoader, EXRLoader } from 'three-stdlib'
import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'
const isArray = (arr: any): arr is string[] => Array.isArray(arr)

const LinearEncoding = 3000
const sRGBEncoding = 3001

export type EnvironmentLoaderProps = {
  files?: string | string[]
  path?: string
  preset?: PresetsType
  extensions?: (loader: Loader) => void
  // TextureEncoding was deprecated in r152, and removed in r162.
  encoding?: typeof LinearEncoding | typeof sRGBEncoding
}

export function useEnvironment({
  files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
  path = '',
  preset = undefined,
  encoding = undefined,
  extensions,
}: Partial<EnvironmentLoaderProps> = {}) {
  let loader: typeof Loader | null = null
  let isCubeMap: boolean = false
  let extension: string | false | undefined

  if (preset) {
    if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    files = presetsObj[preset]
    path = CUBEMAP_ROOT
  }

  // Everything else
  isCubeMap = isArray(files)
  extension = isArray(files)
    ? 'cube'
    : files.startsWith('data:application/exr')
    ? 'exr'
    : files.startsWith('data:application/hdr')
    ? 'hdr'
    : files.split('.').pop()?.split('?')?.shift()?.toLowerCase()
  loader = isCubeMap ? CubeTextureLoader : extension === 'hdr' ? RGBELoader : extension === 'exr' ? EXRLoader : null

  if (!loader) throw new Error('useEnvironment: Unrecognized file extension: ' + files)

  const loaderResult: Texture | Texture[] = useLoader(
    // @ts-expect-error
    loader,
    isCubeMap ? [files] : files,
    (loader) => {
      loader.setPath?.(path)
      if (extensions) extensions(loader)
    }
  ) as Texture | Texture[]
  const texture: Texture | CubeTexture = isCubeMap
    ? // @ts-ignore
      loaderResult[0]
    : loaderResult

  texture.mapping = isCubeMap ? CubeReflectionMapping : EquirectangularReflectionMapping

  if ('colorSpace' in texture) (texture as any).colorSpace = encoding ?? isCubeMap ? 'srgb' : 'srgb-linear'
  else (texture as any).encoding = encoding ?? isCubeMap ? sRGBEncoding : LinearEncoding

  return texture
}
