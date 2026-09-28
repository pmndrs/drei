import * as React from 'react'
import * as THREE from 'three'
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTexture } from '../../src/core/Texture'

// One texture per URL, like the suspense cache behind useLoader: the same key resolves to the
// same object until a test swaps the entry. `useLoader` is mocked rather than run for real
// because its identity behavior is @react-three/fiber's domain, not drei's — what is under
// test here is how useTexture maps its result onto the record keys.
//
// The mock deliberately returns a fresh array on every call. That matches fiber's useLoader on
// stable v9 releases (the array-identity half of fiber#3858 only landed on master), so these
// tests cannot pass by leaning on the loader's array identity — only by comparing values.
const mockTexturesByUrl = new Map<string, THREE.Texture>()

vi.mock('@react-three/fiber', () => ({
  useThree: (selector: (state: { gl: unknown }) => unknown) => selector({ gl: {} }),
  useLoader: (_loader: unknown, input: string | string[]) =>
    Array.isArray(input) ? input.map((url) => mockTexturesByUrl.get(url)) : mockTexturesByUrl.get(input),
}))

describe('useTexture', () => {
  beforeEach(() => {
    mockTexturesByUrl.clear()
  })

  it('returns a reference-stable record when called with an inline literal', () => {
    // An inline object literal is a fresh reference on every render; it is the documented way
    // to call the record form and the subject of #2768.
    const map = new THREE.Texture()
    const normalMap = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', map)
    mockTexturesByUrl.set('/b.png', normalMap)

    const { result, rerender } = renderHook(() => useTexture({ map: '/a.png', normalMap: '/b.png' }))

    const first = result.current
    expect(first.map).toBe(map)
    expect(first.normalMap).toBe(normalMap)

    rerender()
    rerender()

    expect(result.current).toBe(first)
  })

  it('re-maps when the input changes, but not when only its reference does', () => {
    const map = new THREE.Texture()
    const normalMap = new THREE.Texture()
    const roughnessMap = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', map)
    mockTexturesByUrl.set('/b.png', normalMap)
    mockTexturesByUrl.set('/c.png', roughnessMap)

    let input: Record<string, string> = { map: '/a.png', normalMap: '/b.png' }
    const { result, rerender } = renderHook(() => useTexture(input))
    const initial = result.current
    expect(initial.map).toBe(map)

    // Same entries under a new reference: the mapped record must not change identity.
    input = { map: '/a.png', normalMap: '/b.png' }
    rerender()
    expect(result.current).toBe(initial)

    // A different key set must re-map.
    input = { map: '/a.png', roughnessMap: '/c.png' }
    rerender()
    expect(result.current).not.toBe(initial)
    expect(result.current.map).toBe(map)
    expect(result.current.roughnessMap).toBe(roughnessMap)
    expect('normalMap' in result.current).toBe(false)
  })

  it('re-maps when the loader resolves new textures for the same URLs', () => {
    // useLoader.clear() and suspense invalidation can hand back fresh objects for the same
    // input, so keying on the URLs alone is not enough: the resolved textures are part of the
    // comparison.
    const before = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', before)
    const { result, rerender } = renderHook(() => useTexture({ map: '/a.png' }))
    const initial = result.current
    expect(initial.map).toBe(before)

    const after = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', after)
    rerender()

    expect(result.current).not.toBe(initial)
    expect(result.current.map).toBe(after)
  })

  it('keeps the identity stable under StrictMode double rendering', () => {
    const map = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', map)

    const { result, rerender } = renderHook(() => useTexture({ map: '/a.png' }), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    })

    const first = result.current
    rerender()

    expect(result.current).toBe(first)
    expect(result.current.map).toBe(map)
  })

  it('returns the loader result untouched for string and array inputs', () => {
    const a = new THREE.Texture()
    const b = new THREE.Texture()
    mockTexturesByUrl.set('/a.png', a)
    mockTexturesByUrl.set('/b.png', b)

    const single = renderHook(() => useTexture('/a.png'))
    expect(single.result.current).toBe(a)

    const array = renderHook(() => useTexture(['/a.png', '/b.png']))
    expect(array.result.current[0]).toBe(a)
    expect(array.result.current[1]).toBe(b)
  })
})
