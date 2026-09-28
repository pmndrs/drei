import * as React from 'react'
import { Texture as _Texture, TextureLoader } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useLayoutEffect, useEffect, useRef } from 'react'

export const IsObject = (url: unknown): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

type TextureArray<T> = T extends string[] ? _Texture[] : never
type TextureRecord<T> = T extends Record<string, string> ? { [key in keyof T]: _Texture } : never
type SingleTexture<T> = T extends string ? _Texture : never

export type MappedTextureType<T extends string[] | string | Record<string, string>> =
  | TextureArray<T>
  | TextureRecord<T>
  | SingleTexture<T>

export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Url,
  onLoad?: (texture: MappedTextureType<Url>) => void
): MappedTextureType<Url> {
  const gl = useThree((state) => state.gl)
  const textures = useLoader(TextureLoader, IsObject(input) ? Object.values(input) : input) as MappedTextureType<Url>

  useLayoutEffect(() => {
    onLoad?.(textures)
  }, [onLoad])

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  // NOTE: only available for WebGLRenderer
  useEffect(() => {
    if ('initTexture' in gl) {
      let textureArray: _Texture[] = []
      if (Array.isArray(textures)) {
        textureArray = textures
      } else if (textures instanceof _Texture) {
        textureArray = [textures]
      } else if (IsObject(textures)) {
        textureArray = Object.values(textures)
      }

      textureArray.forEach((texture) => {
        if (texture instanceof _Texture) {
          gl.initTexture(texture)
        }
      })
    }
  }, [gl, textures])

  // Map the record form's array result back onto the input's keys while keeping the returned
  // object's identity stable across re-renders (#2768, drei's half of @react-three/fiber#3858).
  //
  // `input` is routinely an inline literal — useTexture({ map: '/a.png' }) — so it is a fresh
  // reference on every render, and a memo keyed on it rebuilt the record every time. Neither can
  // `textures` key a memo by reference: on fiber releases without #3858 it is a fresh array per
  // render even when its textures are unchanged. Instead the freshly mapped record is compared
  // against the previous one by value (same keys, same resolved textures) and reused when equal,
  // so a genuine change always yields a new identity and an incidental re-render never does.
  //
  // Writing a ref during render is safe here because it is a content-keyed cache, not state:
  // `previous` is only returned when it matches the record just built entry for entry, so an
  // abandoned or doubled (StrictMode) render can only leave behind a record the next render
  // reuses or replaces — never a stale or wrong result.
  const keyedRef = useRef<Record<string, _Texture> | null>(null)
  let mappedTextures: MappedTextureType<Url>
  if (IsObject(input)) {
    const previous = keyedRef.current
    const keyed: Record<string, _Texture> = {}
    let i = 0
    for (const key in input) keyed[key] = (textures as _Texture[])[i++]
    mappedTextures =
      previous !== null &&
      Object.keys(previous).length === Object.keys(keyed).length &&
      Object.keys(keyed).every((key) => previous[key] === keyed[key])
        ? (previous as MappedTextureType<Url>)
        : (keyed as MappedTextureType<Url>)
    keyedRef.current = mappedTextures as Record<string, _Texture>
  } else {
    mappedTextures = textures
  }

  return mappedTextures
}

useTexture.preload = (url: string | string[]) => useLoader.preload(TextureLoader, url)
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)

//

export const Texture = ({
  children,
  input,
  onLoad,
}: {
  children?: (texture: ReturnType<typeof useTexture>) => React.ReactNode
  input: Parameters<typeof useTexture>[0]
  onLoad?: Parameters<typeof useTexture>[1]
}) => {
  const ret = useTexture(input, onLoad)

  return <>{children?.(ret)}</>
}
