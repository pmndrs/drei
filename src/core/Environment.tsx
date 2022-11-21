import * as React from 'react'
import { useLoader, useThree, createPortal, useFrame, extend, Object3DNode } from '@react-three/fiber'
import {
  WebGLCubeRenderTarget,
  EquirectangularReflectionMapping,
  CubeTextureLoader,
  Texture,
  Scene,
  Loader,
  CubeCamera,
  HalfFloatType,
  CubeReflectionMapping,
  CubeTexture,
  sRGBEncoding,
  LinearEncoding,
  TextureEncoding,
} from 'three'
import { RGBELoader, GroundProjectedEnv as GroundProjectedEnvImpl } from 'three-stdlib'
import { presetsObj, PresetsType } from '../helpers/environment-assets'

const CUBEMAP_ROOT = 'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/'

export type EnvironmentProps = {
  children?: React.ReactNode
  frames?: number
  near?: number
  far?: number
  resolution?: number
  background?: boolean | 'only'
  blur?: number
  map?: THREE.Texture
  files?: string | string[]
  path?: string
  preset?: PresetsType
  scene?: Scene | React.MutableRefObject<THREE.Scene>
  extensions?: (loader: Loader) => void
  ground?:
    | boolean
    | {
        radius?: number
        height?: number
        scale?: number
      }
  encoding?: TextureEncoding
}

const isRef = (obj: any): obj is React.MutableRefObject<THREE.Scene> => obj.current && obj.current.isScene
const resolveScene = (scene: THREE.Scene | React.MutableRefObject<THREE.Scene>) =>
  isRef(scene) ? scene.current : scene

function setEnvProps(
  background: boolean | 'only',
  scene: Scene | React.MutableRefObject<Scene> | undefined,
  defaultScene: Scene,
  texture: Texture,
  blur = 0
) {
  const target = resolveScene(scene || defaultScene)
  const oldbg = target.background
  const oldenv = target.environment
  // @ts-ignore
  const oldBlur = target.backgroundBlurriness || 0
  if (background !== 'only') target.environment = texture
  if (background) target.background = texture
  // @ts-ignore
  if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = blur
  return () => {
    if (background !== 'only') target.environment = oldenv
    if (background) target.background = oldbg
    // @ts-ignore
    if (background && target.backgroundBlurriness !== undefined) target.backgroundBlurriness = oldBlur
  }
}

export function EnvironmentMap({ scene, background = false, blur, map }: EnvironmentProps) {
  const defaultScene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    if (map) return setEnvProps(background, scene, defaultScene, map, blur)
  }, [defaultScene, scene, map, background, blur])
  return null
}

export function useEnvironment({
  files = ['/px.png', '/nx.png', '/py.png', '/ny.png', '/pz.png', '/nz.png'],
  path = '',
  preset = undefined,
  encoding = undefined,
  extensions,
}: Partial<EnvironmentProps>) {
  if (preset) {
    if (!(preset in presetsObj)) throw new Error('Preset must be one of: ' + Object.keys(presetsObj).join(', '))
    files = presetsObj[preset]
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

export function EnvironmentCube({ background = false, scene, blur, ...rest }: EnvironmentProps) {
  const texture = useEnvironment(rest)
  const defaultScene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    return setEnvProps(background, scene, defaultScene, texture, blur)
  }, [texture, background, scene, defaultScene, blur])
  return null
}

export function EnvironmentPortal({
  children,
  near = 1,
  far = 1000,
  resolution = 256,
  frames = 1,
  map,
  background = false,
  blur,
  scene,
  files,
  path,
  preset = undefined,
  extensions,
}: EnvironmentProps) {
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
    return setEnvProps(background, scene, defaultScene, fbo.texture, blur)
  }, [children, virtualScene, fbo.texture, scene, defaultScene, background, frames, gl])

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
          {/* @ts-ignore */}
          <cubeCamera ref={camera} args={[near, far, fbo]} />
          {files || preset ? (
            <EnvironmentCube background files={files} preset={preset} path={path} extensions={extensions} />
          ) : map ? (
            <EnvironmentMap background map={map} extensions={extensions} />
          ) : null}
        </>,
        virtualScene
      )}
    </>
  )
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      groundProjectedEnvImpl: Object3DNode<GroundProjectedEnvImpl, typeof GroundProjectedEnvImpl>
    }
  }
}

function EnvironmentGround(props: EnvironmentProps) {
  const textureDefault = useEnvironment(props)
  const texture = props.map || textureDefault

  React.useMemo(() => extend({ GroundProjectedEnvImpl }), [])

  const args = React.useMemo<[CubeTexture | Texture]>(() => [texture], [texture])
  const height = (props.ground as any)?.height
  const radius = (props.ground as any)?.radius
  const scale = (props.ground as any)?.scale ?? 1000

  return (
    <>
      <EnvironmentMap {...props} map={texture} />
      <groundProjectedEnvImpl args={args} scale={scale} height={height} radius={radius} />
    </>
  )
}

export function Environment(props: EnvironmentProps) {
  return props.ground ? (
    <EnvironmentGround {...props} />
  ) : props.map ? (
    <EnvironmentMap {...props} />
  ) : props.children ? (
    <EnvironmentPortal {...props} />
  ) : (
    <EnvironmentCube {...props} />
  )
}
