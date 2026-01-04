import { extend } from '@react-three/fiber'
import { Material } from '#three'
import { attribute } from 'three/tsl'

export function FakeCloudMaterial(BaseMaterial: typeof Material) {
  return class extends BaseMaterial {
    constructor(...args: any[]) {
      super(...args)

      //* Read Cloud Opacity Attribute ==============================
      // TSL automatically handles varying interpolation from vertex to fragment
      const cloudOpacity = attribute('cloudOpacity', 'float')

      //* Modify Opacity Node ==============================
      // @ts-ignore - NodeMaterial properties
      if (this.opacityNode) {
        // Multiply existing opacity by cloud opacity
        // @ts-ignore
        this.opacityNode = this.opacityNode.mul(cloudOpacity)
      } else {
        // Use cloud opacity directly
        // @ts-ignore
        this.opacityNode = cloudOpacity
      }
    }
  }
}
