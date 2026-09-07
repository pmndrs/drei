import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { setBarycentricCoordinates } from './WireframeMaterial'

describe('setBarycentricCoordinates', () => {
  it('sizes the barycentric buffer to the post-conversion vertex count for indexed geometry', () => {
    // BoxGeometry: 24 indexed vertices -> 36 vertices after toNonIndexed()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const result = setBarycentricCoordinates(geometry)

    const position = result.getAttribute('position') as THREE.BufferAttribute
    const barycentric = result.getAttribute('barycentric') as THREE.BufferAttribute

    expect(result.index).toBeNull()
    expect(position.count).toBe(36)
    expect(barycentric.count).toBe(position.count)
    expect(barycentric.array).toHaveLength(position.count * 3)
  })

  it('sizes the barycentric buffer for a TorusKnotGeometry like the one in #2814', () => {
    // TorusKnotGeometry: 585 indexed vertices -> 3072 vertices after toNonIndexed()
    const geometry = new THREE.TorusKnotGeometry(1, 0.4, 64, 8)
    const result = setBarycentricCoordinates(geometry)

    const position = result.getAttribute('position') as THREE.BufferAttribute
    const barycentric = result.getAttribute('barycentric') as THREE.BufferAttribute

    expect(position.count).toBe(3072)
    expect(barycentric.count).toBe(position.count)
    expect(barycentric.array).toHaveLength(position.count * 3)
  })

  it('leaves non-indexed geometry on the same instance with a matching buffer', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1).toNonIndexed()
    const result = setBarycentricCoordinates(geometry)

    expect(result).toBe(geometry)

    const position = result.getAttribute('position') as THREE.BufferAttribute
    const barycentric = result.getAttribute('barycentric') as THREE.BufferAttribute

    expect(position.count).toBe(36)
    expect(barycentric.count).toBe(position.count)
    expect(barycentric.array).toHaveLength(position.count * 3)
  })

  it('assigns (1,0,0), (0,1,0), (0,0,1) to each triangle of the expanded geometry', () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const result = setBarycentricCoordinates(geometry)

    const barycentric = result.getAttribute('barycentric') as THREE.BufferAttribute
    const array = barycentric.array as Float32Array

    expect([array[0], array[1], array[2]]).toEqual([1, 0, 0])
    expect([array[3], array[4], array[5]]).toEqual([0, 1, 0])
    expect([array[6], array[7], array[8]]).toEqual([0, 0, 1])

    // The tail of the buffer must be filled too: the pre-fix buffer was sized
    // from the indexed count (24), leaving vertices 24..35 at (0,0,0)
    const lastTriangleStart = (array.length / 3 - 3) * 3
    expect([array[lastTriangleStart], array[lastTriangleStart + 1], array[lastTriangleStart + 2]]).toEqual([1, 0, 0])
  })
})
