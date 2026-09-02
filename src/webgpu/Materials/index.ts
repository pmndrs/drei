//* WebGPU Materials ==============================

export * from '../Staging/BakeShadows'
// BlurPass is deliberately NOT exported: it is still the WebGL implementation.
// It imports @legacy/Materials/ConvolutionMaterial (GLSL ShaderMaterial) and
// WebGLRenderer, which three/webgpu does not export. Tracked in #2811.
//export * from './BlurPass'
export * from '../Effects/Caustics'
export * from '../Staging/ContactShadows'
export * from './ConvolutionMaterial'
export * from './DiscardMaterial'
export * from '../Textures/GradientTexture'
export * from '../UI/Image'
export * from './MeshDiscardMaterial'
export * from './MeshDistortMaterial'
export * from './MeshPortalMaterial'
export * from './MeshReflectorMaterial'
export * from './MeshRefractionMaterial'
export * from './MeshTransmissionMaterial'
export * from './MeshWobbleMaterial'
export * from '../Effects/Outlines'
export * from './SpotLightMaterial'
export * from './WireframeMaterial'
export * from './FakeCloudMaterial'
export * from './HtmlMaterial'
export * from './StarsMaterial'
export * from './SparklesMaterial'
