import { Material } from '#three'
import { attribute } from 'three/tsl'

export function FakeCloudMaterial(BaseMaterial: typeof Material) {
  const mat = new BaseMaterial() as Material
  //* Read Cloud Opacity Attribute ==============================
  // TSL automatically handles varying interpolation from vertex to fragment
  const cloudOpacity = attribute('cloudOpacity', 'float')

  //* Modify Opacity Node ==============================
  // @ts-ignore - NodeMaterial properties
  if (mat.opacityNode) {
    // Multiply existing opacity by cloud opacity
    // @ts-ignore
    mat.opacityNode = mat.opacityNode.mul(cloudOpacity)
  } else {
    // Use cloud opacity directly
    // @ts-ignore
    mat.opacityNode = cloudOpacity
  }

  return mat
}
