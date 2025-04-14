import * as React from 'react'
import { Texture } from 'three'
import { ConstructorRepresentation, useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { KTX2Loader } from 'three-stdlib'
import { IsObject } from './Texture'

const cdn = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master'
const basisCdnPath = `${cdn}/basis/`

export function useKTX2<Url extends string[] | string | Record<string, string>>(
  input: Url,
  loaderParam: string | KTX2Loader | ConstructorRepresentation<KTX2Loader> = basisCdnPath
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const gl = useThree((state) => state.gl)
  const basisPath = typeof loaderParam === 'string' ? loaderParam : basisCdnPath
  const loaderInstanceOrClass = typeof loaderParam === 'string'  ? KTX2Loader : loaderParam
  const textures = useLoader(loaderInstanceOrClass, IsObject(input) ? Object.values(input) : (input as any), (loader: any) => {
    loader.detectSupport(gl)
    loader.setTranscoderPath(basisPath)
  })

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  useEffect(() => {
    const array = Array.isArray(textures) ? textures : [textures]
    array.forEach(gl.initTexture)
  }, [gl, textures])

  if (IsObject(input)) {
    const keys = Object.keys(input)
    const keyed = {} as any
    keys.forEach((key) => Object.assign(keyed, { [key]: textures[keys.indexOf(key)] }))
    return keyed
  } else {
    return textures as any
  }
}

useKTX2.preload = (url: string extends any[] ? string[] : string, loaderParam: string | KTX2Loader | ConstructorRepresentation<KTX2Loader> = basisCdnPath) => {
  const basisPath = typeof loaderParam === 'string' ? loaderParam : basisCdnPath
  const loaderInstanceOrClass = typeof loaderParam === 'string' ? KTX2Loader : loaderParam
  useLoader.preload(loaderInstanceOrClass, url, (loader: any) => {
    loader.setTranscoderPath(basisPath)
  })
}

useKTX2.clear = (input: string | string[]) => useLoader.clear(KTX2Loader, input)

//

export const Ktx2 = ({
  children,
  input,
  basisPath,
}: {
  children?: (texture: ReturnType<typeof useKTX2>) => React.ReactNode
  input: Parameters<typeof useKTX2>[0]
  basisPath?: Parameters<typeof useKTX2>[1]
}) => {
  const texture = useKTX2(input, basisPath)

  return <>{children?.(texture)}</>
}
