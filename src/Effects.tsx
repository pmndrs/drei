import { WebGLMultisampleRenderTarget, RGBAFormat, sRGBEncoding } from 'three'
import React, { useRef, useEffect, useState } from 'react'
import { ReactThreeFiber, extend, useThree, useFrame } from 'react-three-fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'

extend({ EffectComposer, RenderPass, ShaderPass })

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

export function Effects({ children, multisamping = 8, renderIndex = 1 }) {
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
    <effectComposer ref={composer} args={[gl, target]}>
      <renderPass attachArray="passes" args={[scene, camera]} />
      <shaderPass attachArray="passes" args={[GammaCorrectionShader]} />
      {children}
    </effectComposer>
  )
}
