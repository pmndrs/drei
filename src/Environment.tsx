import { PMREMGenerator } from 'three'
import { useEffect } from 'react'
import { useThree } from 'react-three-fiber'
import { useCubeTexture } from './useCubeTexture'

export function Environment({
  background = false,
  files = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
  path = '/',
}) {
  const { gl, scene } = useThree()
  const cubeMap = useCubeTexture(files, { path })
  useEffect(() => {
    const gen = new PMREMGenerator(gl)
    gen.compileEquirectangularShader()
    const hdrCubeRenderTarget = gen.fromCubemap(cubeMap)
    cubeMap.dispose()
    gen.dispose()
    if (background) scene.background = hdrCubeRenderTarget.texture
    scene.environment = hdrCubeRenderTarget.texture
    return () => {
      scene.environment?.dispose()
      scene.environment = scene.background = null
    }
  }, [cubeMap, background, gl, scene])
  return null
}
