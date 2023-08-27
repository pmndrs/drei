import * as React from 'react'
import { RGBAFormat, HalfFloatType, WebGLRenderTarget, UnsignedByteType } from 'three'
import { ReactThreeFiber, extend, useThree, useFrame } from '@react-three/fiber'
import { EffectComposer, RenderPass, ShaderPass, GammaCorrectionShader } from 'three-stdlib'
import mergeRefs from 'react-merge-refs'
import { ForwardRefComponent } from '../helpers/ts-utils'

type Props = ReactThreeFiber.Node<EffectComposer, typeof EffectComposer> & {
  multisamping?: number
  encoding?: number
  type?: number
  renderIndex?: number
  disableGamma?: boolean
  disableRenderPass?: boolean
  disableRender?: boolean
  depthBuffer?: boolean
  stencilBuffer?: boolean
  anisotropy?: number
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

export const Effects: ForwardRefComponent<Props, EffectComposer> = React.forwardRef(
  (
    {
      children,
      multisamping = 8,
      renderIndex = 1,
      disableRender,
      disableGamma,
      disableRenderPass,
      depthBuffer = true,
      stencilBuffer = false,
      anisotropy = 1,
      encoding,
      type,
      ...props
    }: Props,
    ref
  ) => {
    React.useMemo(() => extend({ EffectComposer, RenderPass, ShaderPass }), [])
    const composer = React.useRef<EffectComposer>()
    const { scene, camera, gl, size, viewport } = useThree()
    const [target] = React.useState(() => {
      const t = new WebGLRenderTarget(size.width, size.height, {
        type: type || HalfFloatType,
        format: RGBAFormat,
        depthBuffer,
        stencilBuffer,
        anisotropy,
      })

      // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      if (type === UnsignedByteType && encoding != null) {
        if ('colorSpace' in t) (t.texture as any).colorSpace = encoding
        else t.texture.encoding = encoding
      }

      t.samples = multisamping
      return t
    })

    React.useEffect(() => {
      composer.current?.setSize(size.width, size.height)
      composer.current?.setPixelRatio(viewport.dpr)
    }, [gl, size, viewport.dpr])

    useFrame(() => {
      if (!disableRender) composer.current?.render()
    }, renderIndex)

    const passes: React.ReactNode[] = []
    if (!disableRenderPass)
      passes.push(<renderPass key="renderpass" attach={`passes-${passes.length}`} args={[scene, camera]} />)
    if (!disableGamma)
      passes.push(<shaderPass attach={`passes-${passes.length}`} key="gammapass" args={[GammaCorrectionShader]} />)

    React.Children.forEach(children, (el: any) => {
      el && passes.push(React.cloneElement(el, { key: passes.length, attach: `passes-${passes.length}` }))
    })

    return (
      <effectComposer ref={mergeRefs([ref, composer])} args={[gl, target]} {...props}>
        {passes}
      </effectComposer>
    )
  }
)
