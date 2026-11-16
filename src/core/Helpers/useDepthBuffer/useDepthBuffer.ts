import { DepthTexture, DepthFormat, UnsignedShortType, type WebGLRenderTarget } from '#three'
import * as React from 'react'
import { useThree, useFrame } from '@react-three/fiber/extension'
import { useFBO } from '@core/Portal/Fbo'

function useDepthBuffer({ size = 256, frames = Infinity }: { size?: number; frames?: number } = {}) {
  const dpr = useThree((state) => state.viewport.dpr)
  const { width, height } = useThree((state) => state.size)
  const w = size || width * dpr
  const h = size || height * dpr

  const depthConfig = React.useMemo(() => {
    const depthTexture = new DepthTexture(w, h)
    depthTexture.format = DepthFormat
    depthTexture.type = UnsignedShortType
    return { depthTexture }
  }, [w, h])

  let count = 0
  const depthFBO = useFBO(w, h, depthConfig)
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      // Type-only cast: the renderer union's setRenderTarget only accepts WebGLRenderTarget
      state.renderer.setRenderTarget(depthFBO as WebGLRenderTarget)
      state.renderer.render(state.scene, state.camera)
      state.renderer.setRenderTarget(null)
      count++
    }
  })
  return depthFBO.depthTexture
}

export { useDepthBuffer }
