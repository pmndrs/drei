import * as React from 'react'
import { useLoader, useThree, createPortal, useFrame } from '@react-three/fiber'
import {
  WebGLCubeRenderTarget,
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
  frames?: number
  near?: number
  far?: number
  resolution?: number
  background?: boolean | 'only'
  map?: THREE.Texture
  files?: string | string[]
  path?: string
  preset?: PresetsType
  scene?: Scene | React.MutableRefObject<THREE.Scene>
  extensions?: (loader: Loader) => void
}

const isRef = (obj: any): obj is React.MutableRefObject<THREE.Scene> => obj.current && obj.current.isScene
const resolveScene = (scene: THREE.Scene | React.MutableRefObject<THREE.Scene>) =>
  isRef(scene) ? scene.current : scene

export function Environment(props: Props) {
  return props.map ? (
    <EnvironmentMap {...props} />
  ) : props.children ? (
    <EnvironmentPortal {...props} />
  ) : (
    <EnvironmentCube {...props} />
  )
}

export function EnvironmentMap({ scene, background = false, map }: Props) {
  const defaultScene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    if (map) {
      const target = resolveScene(scene || defaultScene)
      const oldbg = target.background
      const oldenv = target.environment
      if (background !== 'only') target.environment = map
      if (background) target.background = map
      return () => {
        if (background !== 'only') target.environment = oldenv
        if (background) target.background = oldbg
      }
    }
  }, [scene, map])
  return null
}

export function EnvironmentPortal({
  children,
  near = 1,
  far = 1000,
  resolution = 256,
  frames = 1,
  background = false,
  scene,
  files,
  path,
  preset = undefined,
  extensions,
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
    if (frames === 1) camera.current.update(gl, virtualScene)
    const target = resolveScene(scene || defaultScene)
    const oldbg = target.background
    const oldenv = target.environment
    if (background !== 'only') target.environment = fbo.texture
    if (background) target.background = fbo.texture
    return () => {
      if (background !== 'only') target.environment = oldenv
      if (background) target.background = oldbg
    }
  }, [children, scene])

  let count = 1
  useFrame(() => {
    if (frames === Infinity || count < frames) {
      camera.current.update(gl, virtualScene)
      count++
    }
  })

  return (
    <>
      {createPortal(
        <>
          {children}
          <cubeCamera ref={camera} args={[near, far, fbo]} />
          {(files || preset) && (
            <EnvironmentMap
              background
              files={files}
              preset={preset}
              path={path}
              extensions={extensions}
              scene={virtualScene}
            />
          )}
        </>,
        virtualScene
      )}
    </>
  )
}

export function EnvironmentCube({
  background = false,
  files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
  path = '',
  preset = undefined,
  scene,
  extensions,
}: Props) {
  if (preset) {
    if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
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
    const target = resolveScene(scene || defaultScene)
    const oldbg = target.background
    const oldenv = target.environment

    if (background !== 'only') target.environment = texture
    if (background) target.background = texture

    return () => {
      if (background !== 'only') target.environment = oldenv
      if (background) target.background = oldbg
      // Environment textures are volatile, better dispose and uncache them
      texture.dispose()
    }
  }, [texture, background, scene])
  return null
}
