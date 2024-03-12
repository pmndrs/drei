/**
 * Sets `BufferAttribute.updateRange` since r159.
 */
export const setUpdateRange = (
  attribute: THREE.BufferAttribute,
  updateRange: { offset: number; count: number }
): void => {
  if ('updateRanges' in attribute) {
    // r159
    // @ts-ignore
    attribute.updateRanges[0] = updateRange
  } else {
    attribute.updateRange = updateRange
  }
}

export const LinearEncoding = 3000
export const sRGBEncoding = 3001

/**
 * TextureEncoding was deprecated in r152, and removed in r162.
 */
export type TextureEncoding = typeof LinearEncoding | typeof sRGBEncoding
