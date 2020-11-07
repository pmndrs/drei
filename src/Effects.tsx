import { WebGLMultisampleRenderTarget, RGBAFormat, sRGBEncoding } from 'three'
import React, { forwardRef, useRef, useEffect, useState } from 'react'
import { ReactThreeFiber, extend, useThree, useFrame } from 'react-three-fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
import mergeRefs from 'react-merge-refs'

extend({ EffectComposer, RenderPass, ShaderPass })

type Props = ReactThreeFiber.Node<EffectComposer, typeof EffectComposer> & {
  multisamping?: number
  renderIndex?: number
  disableGamma?: boolean
  disableRenderPass?: boolean
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      effectComposer: ReactThreeFiber.Node<EffectComposer, typeof EffectComposer>
      renderPass: ReactThreeFiber.Node<RenderPass, typeof RenderPass>
      shaderPass: ReactThreeFiber.Node<ShaderPass, typeof ShaderPass>
    }
  }
}

export const isWebGL2Available = () => {
  try {
    var canvas = document.createElement('canvas')
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'))
  } catch (e) {
    return false
  }
}

export const Effects = forwardRef(
  (
    { children, multisamping = 8, renderIndex = 1, disableGamma = false, disableRenderPass = false, ...props }: Props,
    ref
  ) => {
    const composer = useRef<EffectComposer>()
    const { scene, camera, gl, size } = useThree()
    const [target] = useState(() => {
      if (isWebGL2Available() && multisamping > 0) {
        const t = new WebGLMultisampleRenderTarget(size.width, size.height, {
          format: RGBAFormat,
          encoding: sRGBEncoding,
        })
        t.samples = 8
        return t
      }
    })

    useEffect(() => {
      composer.current?.setSize(size.width, size.height)
      composer.current?.setPixelRatio(gl.getPixelRatio())
    }, [gl, size])

    useFrame(() => composer.current?.render(), renderIndex)

    return (
      <effectComposer ref={mergeRefs([ref, composer])} args={[gl, target]} {...props}>
        {!disableRenderPass && <renderPass attachArray="passes" args={[scene, camera]} />}
        {!disableGamma && <shaderPass attachArray="passes" args={[GammaCorrectionShader]} />}
        {children}
      </effectComposer>
    )
  }
)
