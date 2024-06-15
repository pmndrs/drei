import * as React from 'react'
import { CubeTextureLoader, CubeTexture as _CubeTexture, Texture } from 'three'
import { useLoader } from '@react-three/fiber'

type Options = {
  path: string
}

export function useCubeTexture(files: string[], { path }: Options): _CubeTexture {
  // @ts-ignore
  const [cubeTexture] = useLoader(
    // @ts-ignore
    CubeTextureLoader,
    [files],
    (loader: CubeTextureLoader) => loader.setPath(path)
  )
  return cubeTexture
}

useCubeTexture.preload = (files: string[], { path }: Options) =>
  useLoader.preload(
    // @ts-ignore
    CubeTextureLoader,
    [files],
    (loader: CubeTextureLoader) => loader.setPath(path)
  )

type CubeTextureProps = {
  children?: (tex: Texture) => React.ReactNode
  files: Parameters<typeof useCubeTexture>[0]
} & Options

export function CubeTexture({ children, files, ...options }: CubeTextureProps) {
  const texture = useCubeTexture(files, { ...options })

  return <>{children?.(texture)}</>
}
