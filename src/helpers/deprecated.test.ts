import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { setUpdateRange } from './deprecated'

describe('setUpdateRange', () => {
  it('sets the first update range of the attribute', () => {
    const attribute = new THREE.BufferAttribute(new Float32Array(12), 3)

    setUpdateRange(attribute, { start: 3, count: 6 })

    expect(attribute.updateRanges).toEqual([{ start: 3, count: 6 }])
  })

  it('replaces a previous update range instead of adding one', () => {
    const attribute = new THREE.BufferAttribute(new Float32Array(12), 3)

    setUpdateRange(attribute, { start: 0, count: 3 })
    setUpdateRange(attribute, { start: 6, count: 3 })

    expect(attribute.updateRanges).toEqual([{ start: 6, count: 3 }])
  })
})
