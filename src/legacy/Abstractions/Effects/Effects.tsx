import * as React from 'react'
import { RGBAFormat, HalfFloatType, WebGLRenderTarget, UnsignedByteType, TextureDataType, ColorSpace } from 'three'
import { extend, useThree, useFrame, ThreeElement, ThreeElements } from '@react-three/fiber'
import { EffectComposer, RenderPass, ShaderPass, GammaCorrectionShader } from 'three-stdlib'
import { ForwardRefComponent } from '@utils/ts-utils'

export type EffectsProps = Omit<ThreeElements['effectComposer'], 'ref' | 'args'> & {
  multisamping?: number
  colorSpace?: ColorSpace
  type?: TextureDataType
  renderIndex?: number
  disableGamma?: boolean
  disableRenderPass?: boolean
  disableRender?: boolean
  depthBuffer?: boolean
  stencilBuffer?: boolean
  anisotropy?: number
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    effectComposer: ThreeElement<typeof EffectComposer>
    renderPass: ThreeElement<typeof RenderPass>
    shaderPass: ThreeElement<typeof ShaderPass>
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

/**
 * Abstraction around three's own [EffectComposer](https://threejs.org/docs/#examples/en/postprocessing/EffectComposer).
 * By default it will prepend a render-pass and a gammacorrection-pass.
 * Children are cloned, `attach` is given to them automatically. You can only use passes or effects in there.
 *
 * By default it creates a render target with HalfFloatType, RGBAFormat. You can change all of this to your liking.
 *
 * @example Basic usage
 * ```jsx
 * import { SSAOPass } from "three-stdlib"
 *
 * extend({ SSAOPass })
 *
 * <Effects multisamping={8} renderIndex={1} disableGamma={false} disableRenderPass={false} disableRender={false}>
 *   <sSAOPass args={[scene, camera, 100, 100]} kernelRadius={1.2} kernelSize={0} />
 * </Effects>
 * ```
 */
export const Effects: ForwardRefComponent<EffectsProps, EffectComposer> = /* @__PURE__ */ React.forwardRef(
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
      colorSpace,
      type,
      ...props
    },
    ref
  ) => {
    React.useMemo(() => extend({ EffectComposer, RenderPass, ShaderPass }), [])
    const composer = React.useRef<EffectComposer>(null!)
    React.useImperativeHandle(ref, () => composer.current, [])
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
      if (type === UnsignedByteType && colorSpace != null) {
        t.texture.colorSpace = colorSpace
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
      <effectComposer ref={composer} args={[gl, target]} {...props}>
        {passes}
      </effectComposer>
    )
  }
)
