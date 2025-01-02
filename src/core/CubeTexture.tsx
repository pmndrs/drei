import * as React from 'react'
import { CubeTextureLoader, CubeTexture as _CubeTexture, Texture } from 'three'
import { useLoader } from '@react-three/fiber'

export type CubeTextureOptions = {
  path: string
}

export function useCubeTexture(files: string[], { path }: CubeTextureOptions): _CubeTexture {
  // @ts-expect-error TODO: fix type upstream
  const [cubeTexture] = useLoader(CubeTextureLoader, [files], (loader) => loader.setPath(path))
  return cubeTexture
}

useCubeTexture.preload = (files: string[], { path }: CubeTextureOptions) =>
  // @ts-expect-error TODO: fix type upstream
  useLoader.preload(CubeTextureLoader, [files], (loader) => loader.setPath(path))

export type CubeTextureProps = CubeTextureOptions & {
  children?: (tex: Texture) => React.ReactNode
  files: Parameters<typeof useCubeTexture>[0]
}

export function CubeTexture({ children, files, ...options }: CubeTextureProps) {
  const texture = useCubeTexture(files, { ...options })

  return <>{children?.(texture)}</>
}
