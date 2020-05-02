import React, { useEffect, useRef, forwardRef } from 'react'
import { extend, useFrame, useThree, ReactThreeFiber } from 'react-three-fiber'
import { Object3D } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass'
// @ts-ignore
import mergeRefs from 'react-merge-refs'

extend({ EffectComposer, RenderPass, GlitchPass })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      effectComposer: ReactThreeFiber.Object3DNode<EffectComposer, typeof EffectComposer>
      glitchPass: ReactThreeFiber.Object3DNode<GlitchPass, typeof GlitchPass>
      renderPass: ReactThreeFiber.Object3DNode<RenderPass, typeof RenderPass>
    }
  }
}

type Props = {
  effectComposerProps: ReactThreeFiber.Object3DNode<EffectComposer, typeof EffectComposer>
  renderPassProps: ReactThreeFiber.Object3DNode<RenderPass, typeof RenderPass>
  glitchPassProps: ReactThreeFiber.Object3DNode<GlitchPass, typeof GlitchPass>
  children: React.ReactElement<Object3D>[]
}

const GlitchEffect = forwardRef(({ effectComposerProps, renderPassProps, glitchPassProps, children }: Props, ref) => {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef<EffectComposer>()
  useEffect(() => composer?.current?.setSize(size.width, size.height), [size])
  useFrame(() => composer?.current?.render(), 1)

  return (
    <effectComposer {...effectComposerProps} ref={mergeRefs([composer, ref])} args={[gl]}>
      <renderPass {...renderPassProps} attachArray="passes" args={[scene, camera]} />
      {children}
      <glitchPass {...glitchPassProps} attachArray="passes" renderToScreen />
    </effectComposer>
  )
})

export default GlitchEffect
