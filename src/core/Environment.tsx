import * as React from 'react'
import { useLoader, useThree } from 'react-three-fiber'
import { CubeTexture, CubeTextureLoader, Texture, PMREMGenerator, Scene } from 'three'
import { RGBELoader } from 'three-stdlib/loaders/RGBELoader'
import { useAsset } from 'use-asset'

import { presetsObj } from '../helpers/environment-assets'

function getTexture(texture: Texture | CubeTexture, gen: PMREMGenerator, isCubeMap: boolean) {
  if (isCubeMap) {
    gen.compileEquirectangularShader()
    return gen.fromCubemap(texture as CubeTexture).texture
  }
  return gen.fromEquirectangular(texture).texture
}

const CUBEMAP_ROOT = 'https://rawcdn.githack.com/mattrossman/drei-assets/b597559ff62f85ec691df28cbea5ecb1263a2085'

type Props = {
  background?: boolean
  files?: string | string[]
  path?: string
  preset?: string
  scene?: Scene
}

export function Environment({
  background = false,
  files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
  path = '/',
  preset = undefined,
  scene,
}: Props) {
  if (preset) {
    if (!(preset in presetsObj)) {
      throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    }
    files = presetsObj[preset]
    path = CUBEMAP_ROOT + '/hdri/'
  }
  const { gl, scene: defaultScene } = useThree()
  const isCubeMap = Array.isArray(files)
  const loader: any = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) =>
    loader.setPath(path)
  )
  const map: Texture = isCubeMap ? loaderResult[0] : loaderResult

  // PMREMGenerator takes its sweet time to generate the env-map,
  // Let's make this part of suspense, or else it just yields a frame-skip
  const texture = useAsset<Texture, [Texture]>(
    () =>
      new Promise((res) => {
        const gen = new PMREMGenerator(gl)
        const texture = getTexture(map, gen, isCubeMap) as Texture
        gen.dispose()
        map.dispose()
        res(texture)
      }),
    map
  )

  React.useLayoutEffect(() => {
    const oldbg = scene ? scene.background : defaultScene.background
    const oldenv = scene ? scene.environment : defaultScene.environment
    if (scene) {
      scene.environment = texture
      if (background) {
        scene.background = texture
      }
    } else {
      defaultScene.environment = texture
      if (background) {
        defaultScene.background = texture
      }
    }
    return () => {
      if (scene) {
        scene.environment = oldenv
        scene.background = oldbg
      } else {
        defaultScene.environment = oldenv
        defaultScene.background = oldbg
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture, background, scene])

  return null
}
