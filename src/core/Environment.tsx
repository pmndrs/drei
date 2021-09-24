import * as React from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import {
  CubeTextureLoader,
  Texture,
  CubeRefractionMapping,
  EquirectangularReflectionMapping,
  Scene,
  Loader,
  FloatType,
} from 'three'
import { RGBELoader } from 'three-stdlib'
import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://rawcdn.githack.com/pmndrs/drei-assets/aa3600359ba664d546d05821bcbca42013587df2'

type Props = {
  background?: boolean
  files?: string | string[]
  path?: string
  preset?: PresetsType
  scene?: Scene
  extensions?: (loader: Loader) => void
}

export function Environment({
  background = false,
  files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
  path = '',
  preset = undefined,
  scene,
  extensions,
}: Props) {
  if (preset) {
    if (!(preset in presetsObj)) {
      throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    }
    files = presetsObj[preset]
    path = CUBEMAP_ROOT + '/hdri/'
  }
  const defaultScene = useThree(({ scene }) => scene)
  const isCubeMap = Array.isArray(files)
  const loader = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) => {
    loader.setPath(path)
    if (!isCubeMap) (loader as RGBELoader).setDataType(FloatType)
    if (extensions) extensions(loader)
  })
  const texture: Texture = isCubeMap ? loaderResult[0] : loaderResult
  texture.mapping = isCubeMap ? CubeRefractionMapping : EquirectangularReflectionMapping

  React.useLayoutEffect(() => {
    const oldbg = scene ? scene.background : defaultScene.background
    const oldenv = scene ? scene.environment : defaultScene.environment
    if (scene) {
      scene.environment = texture
      if (background) scene.background = texture
    } else {
      defaultScene.environment = texture
      if (background) defaultScene.background = texture
    }
    return () => {
      if (scene) {
        scene.environment = oldenv
        scene.background = oldbg
      } else {
        defaultScene.environment = oldenv
        defaultScene.background = oldbg
      }
      // Environment textures are volatile, better dispose them
      texture.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, background, scene])

  return null
}
