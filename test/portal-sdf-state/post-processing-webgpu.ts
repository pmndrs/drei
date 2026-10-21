import { RenderPipeline, RenderTarget, WebGPURenderer, UnsignedByteType } from 'three/webgpu'
import { texture } from 'three/tsl'

export function createPostProcessing(renderer: WebGPURenderer, source: RenderTarget) {
  const output = new RenderTarget(16, 16, { type: UnsignedByteType })
  const pipeline = new RenderPipeline(renderer, texture(source.texture))
  pipeline.outputColorTransform = false
  return {
    render: () => {
      const previous = renderer.getRenderTarget()
      renderer.setRenderTarget(output)
      pipeline.render()
      renderer.setRenderTarget(previous)
    },
    output: () => output,
    dispose: () => {
      output.dispose()
      pipeline.dispose()
    },
  }
}
