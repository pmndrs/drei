import { Texture } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { KTX2Loader } from 'three-stdlib'
import { IsObject } from './useTexture'

const cdn = 'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets@master'
export function useKTX2<Url extends string[] | string | Record<string, string>>(
  input: Url,
  basisPath: string = `${cdn}/basis/`
): Url extends any[] ? Texture[] : Url extends object ? { [key in keyof Url]: Texture } : Texture {
  const gl = useThree((state) => state.gl)
  const textures = useLoader(KTX2Loader, IsObject(input) ? Object.values(input) : (input as any), (loader: any) => {
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

useKTX2.preload = (url: string extends any[] ? string[] : string, basisPath: string = `${cdn}/basis/`) =>
  useLoader.preload(KTX2Loader, url, (loader: any) => {
    loader.setTranscoderPath(basisPath)
  })

useKTX2.clear = (input: string | string[]) => useLoader.clear(KTX2Loader, input)
