import * as React from 'react'
import { extend, ReactThreeFiber } from '@react-three/fiber'
import { DiscardMaterial as DiscardMaterialImpl } from '../materials/DiscardMaterial'
import { ForwardRefComponent } from '../helpers/ts-utils'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      discardMaterialImpl: ReactThreeFiber.ShaderMaterialProps
    }
  }
}

export const MeshDiscardMaterial: ForwardRefComponent<JSX.IntrinsicElements['shaderMaterial'], THREE.ShaderMaterial> =
  React.forwardRef((props: JSX.IntrinsicElements['shaderMaterial'], fref: React.ForwardedRef<THREE.ShaderMaterial>) => {
    extend({ DiscardMaterialImpl })
    return <discardMaterialImpl ref={fref} {...props} />
  })
