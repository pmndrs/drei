import { DepthTexture, DepthFormat, UnsignedShortType } from 'three'
import * as React from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useFBO } from './useFBO'

const DepthBuffer = React.forwardRef(({ size = 256 }: { size?: number }, ref) => {
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

  const depthFBO = useFBO(w, h, depthConfig)
  React.useImperativeHandle(ref, () => depthFBO?.depthTexture)
  return useFrame((state) => {
    state.gl.setRenderTarget(depthFBO)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(null)
  })
})

export { DepthBuffer }
