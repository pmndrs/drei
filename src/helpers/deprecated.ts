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
