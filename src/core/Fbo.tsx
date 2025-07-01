import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { forwardRef } from 'react'

type WebGLRenderTargetCtorParams = ConstructorParameters<typeof THREE.WebGLRenderTarget>
type WebGLRenderTargetOptions = WebGLRenderTargetCtorParams[2]

type FBOSettings = {
  /** @deprecated If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
  depth?: boolean
} & WebGLRenderTargetOptions

// 👇 uncomment when TS version supports function overloads
// export function useFBO(settings?: FBOSettings)
export function useFBO(
  /** Width in pixels, or settings (will render fullscreen by default) */
  width?: number | FBOSettings,
  /** Height in pixels */
  height?: number,
  /**Settings */
  settings?: FBOSettings
): THREE.WebGLRenderTarget {
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const _width = typeof width === 'number' ? width : size.width * viewport.dpr
  const _height = typeof height === 'number' ? height : size.height * viewport.dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}
  const { samples = 0, depth, ...targetSettings } = _settings

  const depthBuffer = depth ?? _settings.depthBuffer // backwards compatibility for deprecated `depth` prop

  const target = React.useMemo(() => {
    const target = new THREE.WebGLRenderTarget(_width, _height, {
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

//
// Fbo component
//

type UseFBOParams = Parameters<typeof useFBO>
type Fbo = ReturnType<typeof useFBO>

export type FboProps = {
  children?: (target: Fbo) => React.ReactNode
  width: UseFBOParams[0]
  height: UseFBOParams[1]
} & FBOSettings

export const Fbo = /* @__PURE__ */ forwardRef<Fbo, FboProps>(({ children, width, height, ...settings }, fref) => {
  const target = useFBO(width, height, settings)

  return <>{children?.(target)}</>
})
