import { describe, expect, it } from 'vitest'
import { BoxGeometry, PlaneGeometry, TorusKnotGeometry } from 'three/webgpu'
import { setBarycentricCoordinates } from './WireframeMaterial'

describe('setBarycentricCoordinates (WebGPU)', () => {
  it('sizes the barycentric attribute from the de-indexed geometry, not the indexed one (#2814)', () => {
    const indexed = new TorusKnotGeometry()
    expect(indexed.index).not.toBeNull()
    const indexedCount = indexed.getAttribute('position').count

    const result = setBarycentricCoordinates(indexed)
    const position = result.getAttribute('position')
    const barycentric = result.getAttribute('barycentric')

    expect(result.index).toBeNull()
    // toNonIndexed() expands the vertex list (585 -> 3072 on the default knot)
    expect(position.count).toBeGreaterThan(indexedCount)
    expect(barycentric.itemSize).toBe(3)
    expect(barycentric.count).toBe(position.count)
  })

  it('returns a new geometry for indexed input and the same geometry for non-indexed input', () => {
    const indexed = new BoxGeometry()
    expect(setBarycentricCoordinates(indexed)).not.toBe(indexed)

    const nonIndexed = new BoxGeometry().toNonIndexed()
    expect(setBarycentricCoordinates(nonIndexed)).toBe(nonIndexed)
    expect(nonIndexed.getAttribute('barycentric').count).toBe(nonIndexed.getAttribute('position').count)
  })

  it('gives every triangle three distinct corners that each sum to 1', () => {
    const geometry = setBarycentricCoordinates(new TorusKnotGeometry())
    const barycentric = geometry.getAttribute('barycentric')

    for (let i = 0; i < barycentric.count; i += 3) {
      const corners = [0, 1, 2].map((c) => [barycentric.getX(i + c), barycentric.getY(i + c), barycentric.getZ(i + c)])
      for (const corner of corners) {
        expect(corner[0] + corner[1] + corner[2]).toBe(1)
      }
      expect(new Set(corners.map((c) => c.join(','))).size).toBe(3)
    }
  })

  it('simplify lifts the third corner so the quad diagonal is not drawn (#2815)', () => {
    const plain = setBarycentricCoordinates(new PlaneGeometry(1, 1, 2, 2))
    const simplified = setBarycentricCoordinates(new PlaneGeometry(1, 1, 2, 2), true)
    const plainAttr = plain.getAttribute('barycentric')
    const simpleAttr = simplified.getAttribute('barycentric')

    expect(simpleAttr.count).toBe(plainAttr.count)

    for (let i = 0; i < plainAttr.count; i += 3) {
      // First two corners are identical either way
      for (const c of [0, 1]) {
        expect(simpleAttr.getX(i + c)).toBe(plainAttr.getX(i + c))
        expect(simpleAttr.getY(i + c)).toBe(plainAttr.getY(i + c))
        expect(simpleAttr.getZ(i + c)).toBe(plainAttr.getZ(i + c))
      }
      // Third corner is (1, 0, 0) normally and (1, 0, 1) when simplified
      expect(plainAttr.getZ(i + 2)).toBe(0)
      expect(simpleAttr.getX(i + 2)).toBe(1)
      expect(simpleAttr.getY(i + 2)).toBe(0)
      expect(simpleAttr.getZ(i + 2)).toBe(1)
    }
  })
})
