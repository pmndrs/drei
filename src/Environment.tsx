import * as React from 'react'
import { useLoader, useThree } from 'react-three-fiber'
import { CubeTextureLoader, Texture, PMREMGenerator } from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'

function getTexture(texture, gen, isCubeMap) {
  if (isCubeMap) {
    gen.compileEquirectangularShader()
    return gen.fromCubemap(texture).texture
  }
  return gen.fromEquirectangular(texture).texture
}

export function Environment({
  background = false,
  files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
  path = '/',
}) {
  const { gl, scene } = useThree()
  const isCubeMap = Array.isArray(files)
  const loader: any = isCubeMap ? CubeTextureLoader : RGBELoader
  // @ts-expect-error
  const loaderResult: Texture | Texture[] = useLoader(loader, isCubeMap ? [files] : files, (loader) =>
    loader.setPath(path)
  )
  const map = isCubeMap ? loaderResult[0] : loaderResult

  React.useLayoutEffect(() => {
    const gen = new PMREMGenerator(gl)
    const texture = getTexture(map, gen, isCubeMap)
    if (background) scene.background = texture
    scene.environment = texture
    map.dispose()
    gen.dispose()
    return () => {
      scene.environment = scene.background = null
    }
  }, [gl, map, isCubeMap, background, scene])

  return null
}
