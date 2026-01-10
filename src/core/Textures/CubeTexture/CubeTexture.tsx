import * as React from 'react'
import { CubeTextureLoader, CubeTexture as _CubeTexture } from '#three'
import { useLoader } from '@react-three/fiber'

//* Types ==============================

interface CubeTextureOptions {
  path: string
}

export interface CubeTextureProps extends CubeTextureOptions {
  children?: (texture: _CubeTexture) => React.ReactNode
  files: string[]
}

//* Hook ==============================

export function useCubeTexture(files: string[], { path }: CubeTextureOptions): _CubeTexture {
  const [cubeTexture] = useLoader(CubeTextureLoader, [files], (loader) => loader.setPath(path))
  return cubeTexture
}

useCubeTexture.preload = (files: string[], { path }: CubeTextureOptions) =>
  useLoader.preload(CubeTextureLoader, [files], (loader) => loader.setPath(path))

/**
 * Loads a cube texture (6 images) for use as environment maps.
 *
 * @example Basic usage
 * ```jsx
 * <CubeTexture files={['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']} path="cube/">
 *   {(texture) => <primitive object={texture} attach="background" />}
 * </CubeTexture>
 * ```
 */
export function CubeTexture({ children, files, ...options }: CubeTextureProps) {
  const texture = useCubeTexture(files, { ...options })
  return <>{children?.(texture)}</>
}
