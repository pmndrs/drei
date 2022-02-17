import * as React from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { FloatType, EquirectangularReflectionMapping, CubeTextureLoader, Texture, Scene, Loader } from 'three'
import { RGBELoader } from 'three-stdlib'

import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/'

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
    path = CUBEMAP_ROOT

    console.log('hello env', preset, files, path)
  }
  const defaultScene = useThree(({ scene }) => scene)
  const isCubeMap = Array.isArray(files)
  const loader = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) => {
    loader.setPath(path)
    // @ts-expect-error
    loader.setDataType?.(FloatType)
    if (extensions) extensions(loader)
  })
  const texture: Texture = isCubeMap ? loaderResult[0] : loaderResult
  texture.mapping = EquirectangularReflectionMapping

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
      // Environment textures are volatile, better dispose and uncache them
      texture.dispose()
    }
  }, [texture, background, scene])

  return null
}
