import * as React from 'react'
import { CubeTextureLoader, CubeTexture as _CubeTexture } from '#three'
import { useLoader } from '@react-three/fiber'

export function useCubeTexture(files: string[], { path }: CubeTextureOptions): _CubeTexture {
  const [cubeTexture] = useLoader(CubeTextureLoader, [files], (loader) => loader.setPath(path))
  return cubeTexture
}

useCubeTexture.preload = (files: string[], { path }: CubeTextureOptions) =>
  useLoader.preload(CubeTextureLoader, [files], (loader) => loader.setPath(path))

export function CubeTexture({ children, files, ...options }: CubeTextureProps) {
  const texture = useCubeTexture(files, { ...options })
  return <>{children?.(texture)}</>
}
