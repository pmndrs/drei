import * as React from 'react'
import { RGBAFormat, sRGBEncoding, WebGLRenderTarget } from 'three'
import { ReactThreeFiber, extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, RenderPass, ShaderPass, GammaCorrectionShader } from 'three-stdlib'

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

export const Effects = React.forwardRef(
  (
    { children, multisamping = 8, renderIndex = 1, disableGamma = false, disableRenderPass = false, ...props }: Props,
    ref
  ) => {
    const composer = React.useRef<EffectComposer>()
    const scene = useThree((state) => state.scene)
    const camera = useThree((state) => state.camera)
    const gl = useThree((state) => state.gl)
    const size = useThree((state) => state.size)
    const [target] = React.useState(() => {
      const t = new WebGLRenderTarget(size.width, size.height, {
        format: RGBAFormat,
        encoding: gl.outputEncoding,
      })
      t.samples = multisamping
      return t
    })

    React.useEffect(() => {
      composer.current?.setSize(size.width, size.height)
      composer.current?.setPixelRatio(gl.getPixelRatio())
    }, [gl, size])

    useFrame(() => composer.current?.render(), renderIndex)

    const passes: React.ReactNode[] = []
    if (!disableRenderPass) passes.push(<renderPass key="renderpass" args={[scene, camera]} />)
    if (!disableGamma) passes.push(<shaderPass key="gammapass" args={[GammaCorrectionShader]} />)
    React.Children.forEach(children, (el: any, index) =>
      passes.push(React.cloneElement(el, { key: index, attach: `passes-${index}` }))
    )

    return (
      <effectComposer ref={mergeRefs([ref, composer])} args={[gl, target]} {...props}>
        {passes}
      </effectComposer>
    )
  }
)
