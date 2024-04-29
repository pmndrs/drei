import * as React from 'react'
import { ShaderMaterial } from 'three'
import { extend, ThreeElements } from '@react-three/fiber'
import { DiscardMaterial as DiscardMaterialImpl } from '../materials/DiscardMaterial'
import { ForwardRefComponent } from '../helpers/ts-utils'

declare module '@react-three/fiber' {
  interface ThreeElements {
    discardMaterialImpl: ThreeElements['shaderMaterial']
  }
}

export const MeshDiscardMaterial: ForwardRefComponent<ThreeElements['shaderMaterial'], ShaderMaterial> =
  /* @__PURE__ */ React.forwardRef(
    (props: ThreeElements['shaderMaterial'], fref: React.ForwardedRef<ShaderMaterial>) => {
      extend({ DiscardMaterialImpl })
      return <discardMaterialImpl ref={fref} {...props} />
    }
  )
