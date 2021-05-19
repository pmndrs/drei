import * as React from 'react'
import { useLoader, useThree } from '@react-three/fiber'
import { CubeTexture, CubeTextureLoader, Texture, PMREMGenerator, Scene, Loader } from 'three'
import { RGBELoader } from 'three-stdlib'
import { useAsset } from 'use-asset'

import { presetsObj, PresetsType } from '../helpers/environment-assets'

function getTexture(texture: Texture | CubeTexture, gen: PMREMGenerator, isCubeMap: boolean) {
  if (isCubeMap) {
    gen.compileEquirectangularShader()
    return gen.fromCubemap(texture as CubeTexture).texture
  }
  return gen.fromEquirectangular(texture).texture
}

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
  const gl = useThree(({ gl }) => gl)
  const isCubeMap = Array.isArray(files)
  const loader = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) => {
    loader.setPath(path)
    if (extensions) extensions(loader)
  })
  const map: Texture = isCubeMap ? loaderResult[0] : loaderResult

  // PMREMGenerator takes its sweet time to generate the env-map,
  // Let's make this part of suspense, or else it just yields a frame-skip
  const texture = useAsset<Texture, [Texture]>(
    () =>
      new Promise((res) => {
        const gen = new PMREMGenerator(gl)
        const texture = getTexture(map, gen, isCubeMap) as Texture
        gen.dispose()
        res(texture)
      }),
    map
  )

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
      useAsset.clear(map)
      texture.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, background, scene])

  return null
}
