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

const CUBEMAP_ROOT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736'

const presets = {
  apartment: 'lebombo_1k.hdr',
  city: 'potsdamer_platz_1k.hdr',
  dawn: 'kiara_1_dawn_1k.hdr',
  forest: 'forest_slope_1k.hdr',
  lobby: 'st_fagans_interior_1k.hdr',
  night: 'dikhololo_night_1k.hdr',
  park: 'rooitou_park_1k.hdr',
  studio: 'studio_small_03_1k.hdr',
  sunset: 'venice_sunset_1k.hdr',
  warehouse: 'empty_warehouse_01_1k.hdr',
}

export type Presets = keyof typeof presets

export type EnvironmentLoaderProps = {
  files?: string | string[]
  path?: string
  preset?: Presets
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
    if (!(preset in presets)) throw new Error('Preset must be one of: ' + Object.keys(presets).join(', '))
    files = presets[preset]
    path = CUBEMAP_ROOT
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
