import * as React from 'react'
import { useLoader, useThree, createPortal } from '@react-three/fiber'
import {
  WebGLCubeRenderTarget,
  LinearFilter,
  FloatType,
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Scene,
  Loader,
  CubeCamera,
  HalfFloatType,
} from 'three'
import { RGBELoader } from 'three-stdlib'

import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/'

type Props = {
  children?: React.ReactNode
  near?: number
  far?: number
  resolution?: number
  background?: boolean
  files?: string | string[]
  path?: string
  preset?: PresetsType
  scene?: Scene
  extensions?: (loader: Loader) => void
}

export function Environment(props: Props) {
  return props.children ? <EnvironmentPortal {...props} /> : <EnvironmentMap {...props} />
}

export function EnvironmentPortal({
  children,
  near = 1,
  far = 1000,
  resolution = 256,
  background = false,
  scene,
}: Props) {
  const gl = useThree((state) => state.gl)
  const defaultScene = useThree((state) => state.scene)
  const camera = React.useRef<CubeCamera>(null!)
  const [virtualScene] = React.useState(() => new Scene())
  const fbo = React.useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  React.useLayoutEffect(() => {
    camera.current.update(gl, virtualScene)
    const oldbg = scene ? scene.background : defaultScene.background
    const oldenv = scene ? scene.environment : defaultScene.environment
    const target = scene || defaultScene
    target.environment = fbo.texture
    if (background) target.background = fbo.texture
    return () => {
      target.environment = oldenv
      target.background = oldbg
    }
  }, [children, scene])

  return (
    <>
      {createPortal(
        <group>
          {children}
          <cubeCamera ref={camera} args={[near, far, fbo]} />
        </group>,
        virtualScene
      )}
    </>
  )
}

export function EnvironmentMap({
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
  }

  const defaultScene = useThree((state) => state.scene)
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
    const target = scene || defaultScene
    target.environment = texture
    if (background) target.background = texture
    return () => {
      target.environment = oldenv
      target.background = oldbg
      // Environment textures are volatile, better dispose and uncache them
      texture.dispose()
    }
  }, [texture, background, scene])
  return null
}
