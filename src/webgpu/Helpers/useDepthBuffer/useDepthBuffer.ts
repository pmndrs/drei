//* useDepthBuffer - WebGPU Version ==============================
// Creates a depth texture of the scene for soft edge effects
// Uses ping-pong buffers to avoid WebGPU feedback loops:
// 1. Render scene depth to target A
// 2. Copy depth from A to B (in color buffer) using TSL
// 3. Return B for sampling in materials

import * as React from 'react'
import { DepthTexture, DepthFormat, FloatType, RenderTarget, PlaneGeometry, Mesh, Scene, OrthographicCamera, Texture } from '#three'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { texture, uv, uniformTexture } from 'three/tsl'
import { useThree, useFrame } from '@react-three/fiber'

export interface UseDepthBufferOptions {
  /** Size of the depth texture (default: 256) */
  size?: number
  /** Number of frames to capture (default: Infinity) */
  frames?: number
}

/**
 * WebGPU-compatible depth buffer hook with ping-pong buffers
 *
 * WebGPU doesn't allow a texture to be both a render attachment and
 * sampled in the same synchronization scope. This hook uses two render targets:
 * - Target A: receives scene depth render
 * - Target B: copy of depth as color, safe to sample in materials
 *
 * Frame order:
 * 1. 'update' - normal updates
 * 2. spotlights hide themselves (after 'update', before 'depthCapture')
 * 3. 'depthCapture' - render depth to A, copy to B (meshes invisible)
 * 4. spotlights show themselves (after 'depthCapture', before 'render')
 * 5. 'render' - main render with depth buffer (samples from B)
 */
function useDepthBuffer({ size = 256, frames = Infinity }: UseDepthBufferOptions = {}) {
  const dpr = useThree((state) => state.viewport.dpr)
  const { width, height } = useThree((state) => state.size)

  const w = size || width * dpr
  const h = size || height * dpr

  //* Create ping-pong render targets and copy resources --
  const { targetA, targetB, copyQuad, copyScene, copyCamera, depthUniform } = React.useMemo(() => {
    // Target A: scene depth render target
    const depthTexA = new DepthTexture(w, h)
    depthTexA.format = DepthFormat
    depthTexA.type = FloatType
    const tA = new RenderTarget(w, h, { depthTexture: depthTexA, depthBuffer: true })

    // Target B: copy target for sampling (color buffer stores depth values)
    const tB = new RenderTarget(w, h, { depthBuffer: false })

    // Create TSL material for depth copy
    const depthTex = uniformTexture(new Texture())
    const copyMaterial = new MeshBasicNodeMaterial()

    // Sample depth texture and output as grayscale color
    // Using uv() to get standard UV coordinates for full-screen quad
    copyMaterial.colorNode = texture(depthTex, uv()).xxxx // Spread R to all channels

    const geometry = new PlaneGeometry(2, 2)
    const mesh = new Mesh(geometry, copyMaterial)
    const scene = new Scene()
    scene.add(mesh)
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

    return {
      targetA: tA,
      targetB: tB,
      copyQuad: mesh,
      copyScene: scene,
      copyCamera: camera,
      depthUniform: depthTex,
    }
  }, [w, h])

  //* Cleanup on unmount --
  React.useEffect(() => {
    return () => {
      targetA.dispose()
      targetA.depthTexture?.dispose()
      targetB.dispose()
      copyQuad.geometry.dispose()
      ;(copyQuad.material as MeshBasicNodeMaterial).dispose()
    }
  }, [targetA, targetB, copyQuad])

  //* Capture depth - runs after spotlights hide, before render --
  const frameCount = React.useRef(0)

  useFrame(
    (state) => {
      if (frames === Infinity || frameCount.current < frames) {
        const { gl, scene, camera } = state

        // Step 1: Render scene depth to target A
        // At this point, volumetric meshes should be hidden by their own useFrame callbacks
        gl.setRenderTarget(targetA as any)
        gl.render(scene, camera)

        // Step 2: Copy depth from A to B as a color texture using TSL
        // This creates a separate render pass with B as render target
        depthUniform.value = targetA.depthTexture!
        gl.setRenderTarget(targetB as any)
        gl.render(copyScene, copyCamera)

        // Reset render target for main render
        gl.setRenderTarget(null)
        frameCount.current++
      }
    },
    { id: 'depthCapture', after: 'update', before: 'render' }
  )

  // Return the color texture from B (contains depth values in R channel)
  return targetB.texture
}

export { useDepthBuffer }
