import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { CopyShader } from 'three/addons/shaders/CopyShader.js'
import { WebGLRenderer, WebGLRenderTarget } from 'three'

export function createPostProcessing(renderer: WebGLRenderer, source: WebGLRenderTarget) {
  const composer = new EffectComposer(renderer, new WebGLRenderTarget(16, 16))
  composer.renderToScreen = false
  const pass = new ShaderPass(
    {
      uniforms: { source: { value: null } },
      vertexShader: CopyShader.vertexShader,
      fragmentShader:
        'varying vec2 vUv; uniform sampler2D source; void main() { gl_FragColor = texture2D(source, vUv); }',
    },
    'unused'
  )
  pass.uniforms.source.value = source.texture
  composer.addPass(pass)
  return {
    render: () => composer.render(),
    output: () => composer.readBuffer,
    dispose: () => {
      composer.passes.forEach((pass) => pass.dispose())
      composer.dispose()
    },
  }
}
