import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

type FBOSettings<T extends boolean = false> = { multisample?: T; samples?: number } & THREE.WebGLRenderTargetOptions

// 👇 uncomment when TS version supports function overloads

// export function useFBO(settings?: FBOSettings)
export function useFBO<T extends boolean = false>(
  width?: number | FBOSettings<T>,
  height?: number,
  settings?: FBOSettings<T>
): THREE.WebGLRenderTarget {
  const { gl, size, viewport } = useThree()
  const _width = typeof width === 'number' ? width : size.width * viewport.dpr
  const _height = typeof height === 'number' ? height : size.height * viewport.dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}
  const { samples, ...targetSettings } = _settings

  const target = React.useMemo(() => {
    let target
    target = new THREE.WebGLRenderTarget(_width, _height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      encoding: gl.outputEncoding,
      type: THREE.HalfFloatType,
      ...targetSettings,
    })
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
