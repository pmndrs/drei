//* useFBO - Frame Buffer Object Hook ==============================
// Platform-agnostic FBO implementation using RenderTarget from #drei-platform
// WebGL uses THREE.WebGLRenderTarget, WebGPU uses THREE.RenderTarget

import * as React from 'react'
import * as THREE from '#three'
import { useThree } from '@react-three/fiber'
import { forwardRef, useImperativeHandle } from 'react'
import { type RenderTargetOptions } from '#three'
import { RenderTarget } from '#drei-platform'

type FBOSettings = {
  /** @deprecated use `depthBuffer` instead. If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
  depth?: boolean
} & RenderTargetOptions

// 👇 uncomment when TS version supports function overloads
// export function useFBO(settings?: FBOSettings)

/**
 * Creates a THREE.WebGLRenderTarget (or THREE.RenderTarget for WebGPU).
 * Automatically disposed when unmounted.
 *
 * @example Basic usage
 * ```jsx
 * const target = useFBO({ stencilBuffer: false })
 * ```
 *
 * @example Custom resolution
 * ```jsx
 * const target = useFBO(1024, 1024, { samples: 4 }) // WebGPU only supports 1 and 4
 * ```
 */
export function useFBO(
  /** Width in pixels, or settings (will render fullscreen by default) */
  width?: number | FBOSettings,
  /** Height in pixels */
  height?: number,
  /**Settings */
  settings?: FBOSettings
) {
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const _width = typeof width === 'number' ? width : size.width * viewport.dpr
  const _height = typeof height === 'number' ? height : size.height * viewport.dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}
  const { samples = 0, depth, ...targetSettings } = _settings

  const depthBuffer = depth ?? _settings.depthBuffer // backwards compatibility for deprecated `depth` prop

  const target = React.useMemo(() => {
    const target = new RenderTarget(_width, _height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      ...targetSettings,
    })

    if (depthBuffer) {
      target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType)
    }

    target.samples = samples
    return target
  }, [])

  React.useLayoutEffect(() => {
    target.setSize(_width, _height)
    if (samples) target.samples = samples
  }, [samples, target, _width, _height])

  React.useEffect(() => {
    return () => target.dispose()
  }, [])

  return target
}

//* Fbo Component ==============================
// Declarative wrapper around useFBO hook

type UseFBOParams = Parameters<typeof useFBO>
type Fbo = ReturnType<typeof useFBO>

export type FboProps = {
  /** Render function receiving the render target */
  children?: (target: Fbo) => React.ReactNode
  /** Width in pixels */
  width?: UseFBOParams[0]
  /** Height in pixels */
  height?: UseFBOParams[1]
} & FBOSettings

/**
 * Declarative component wrapper for useFBO. Access target via render prop or ref.
 *
 * @example Via render prop
 * ```jsx
 * <Fbo width={1024} height={1024}>
 *   {(target) => <mesh><meshBasicMaterial map={target.texture} /></mesh>}
 * </Fbo>
 * ```
 *
 * @example Via ref
 * ```jsx
 * const fboRef = useRef()
 * <Fbo ref={fboRef} width={512} height={512} />
 * ```
 */
export const Fbo = /* @__PURE__ */ forwardRef<Fbo, FboProps>(({ children, width, height, ...settings }, fref) => {
  const target = useFBO(width, height, settings)

  useImperativeHandle(fref, () => target, [target]) // expose target through ref

  return <>{children?.(target)}</>
})
