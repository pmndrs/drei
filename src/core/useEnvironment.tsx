import { useLoader } from '@react-three/fiber'
import {
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Loader,
  CubeReflectionMapping,
  CubeTexture,
  sRGBEncoding,
  LinearEncoding,
  TextureEncoding,
} from 'three'
import { RGBELoader } from 'three-stdlib'
import { suspend } from 'suspend-react'
import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/'

const isPromise = (promise: any): promise is Promise<{ ['default']: string }> =>
  typeof promise === 'object' && typeof (promise as Promise<any>).then === 'function'

export type EnvironmentLoaderProps = {
  files?: string | string[] | Promise<{ ['default']: string }>
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
  if (preset) {
    if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    files = presetsObj[preset]
    path = CUBEMAP_ROOT
  }

  // Using promises that return inline-URLs by default
  if (isPromise(files)) {
    files = suspend(
      async (promise) => {
        const result = await promise
        return result.default
      },
      [files]
    )
  }

  const isCubeMap = Array.isArray(files)
  const loader = isCubeMap ? CubeTextureLoader : RGBELoader
  const loaderResult: Texture | Texture[] = useLoader(
    // @ts-expect-error
    loader,
    isCubeMap ? [files] : files,
    (loader) => {
      loader.setPath(path)
      if (extensions) extensions(loader)
    }
  )
  const texture: Texture | CubeTexture = isCubeMap
    ? // @ts-ignore
      loaderResult[0]
    : loaderResult
  texture.mapping = isCubeMap ? CubeReflectionMapping : EquirectangularReflectionMapping
  texture.encoding = encoding ?? isCubeMap ? sRGBEncoding : LinearEncoding
  return texture
}
