import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from 'react-three-fiber'

type FBOSettings = { multisample?: boolean; samples?: number } & THREE.WebGLRenderTargetOptions

// 👇 uncomment when TS version supports function overloads

// export function useFBO(settings?: FBOSettings)
export function useFBO(width?: number | FBOSettings, height?: number, settings?: FBOSettings) {
  const { size, gl } = useThree()
  const dpr = useMemo(() => gl.getPixelRatio(), [gl])
  const _width = typeof width === 'number' ? width : size.width * dpr
  const _height = typeof width === 'number' ? (height as number) : size.height * dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}

  const target = useMemo(() => {
    const { multisample, samples, ...targetSettings } = _settings
    let target
    if (multisample && gl.capabilities.isWebGL2) {
      target = new THREE.WebGLMultisampleRenderTarget(_width, _height, targetSettings)
      if (samples) target.samples = samples
    } else {
      target = new THREE.WebGLRenderTarget(_width, _height, targetSettings)
    }
    return target
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    target.setSize(_width, _height)
  }, [target, _width, _height])

  return target
}
