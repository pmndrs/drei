import { useLayoutEffect } from 'react'
import { useLoader, useThree } from 'react-three-fiber'
import { CubeTextureLoader, Texture, PMREMGenerator } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { useAsset } from 'use-asset'
import cubemapObj from './helpers/cubemap-assets.json'

function getTexture(texture, gen, isCubeMap) {
  if (isCubeMap) {
    gen.compileEquirectangularShader()
    return gen.fromCubemap(texture).texture
  }
  return gen.fromEquirectangular(texture).texture
}

const CUBEMAP_ROOT = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r123/examples/textures/cube'

type Props = {
  background?: boolean
  files?: string | string[]
  path?: string
  preset?: string
}

export function Environment({
  background = false,
  files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
  path = '/',
  preset = undefined,
}: Props) {
  if (preset) {
    files = cubemapObj[preset].files
    path = `${CUBEMAP_ROOT}/${cubemapObj[preset].folder}/`
  }
  const { gl, scene } = useThree()
  const isCubeMap = Array.isArray(files)
  const loader: any = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) =>
    loader.setPath(path)
  )
  const map = isCubeMap ? loaderResult[0] : loaderResult

  // PMREMGenerator takes its sweet time to generate the env-map,
  // Let's make this part of suspense, or else it just yields a frame-skip
  const texture = useAsset(
    () =>
      new Promise((res) => {
        const gen = new PMREMGenerator(gl)
        const texture = getTexture(map, gen, isCubeMap)
        gen.dispose()
        map.dispose()
        res(texture)
      }),
    [map, background]
  )

  useLayoutEffect(() => {
    const oldbg = scene.background
    const oldenv = scene.environment
    if (background) scene.background = texture
    scene.environment = texture
    return () => {
      scene.environment = oldenv
      scene.background = oldbg
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture])

  return null
}
