//* Drei Platform Components - WebGPU Version ==============================
// This file re-exports drei components that have separate WebGL/WebGPU implementations.
// For WebGPU builds, this file is used via the #drei-platform alias.
// Core components can import from here to get platform-appropriate implementations.

//* Shadows --------------------------------
export { ContactShadows } from '../webgpu/Staging/ContactShadows'
export type { ContactShadowsProps } from '../webgpu/Staging/ContactShadows'

export { AccumulativeShadows, RandomizedLight } from '../webgpu/Staging/AccumulativeShadows'
export type { AccumulativeShadowsProps, RandomizedLightProps } from '../webgpu/Staging/AccumulativeShadows'

//* Materials --------------------------------
export { Caustics } from '../webgpu/Effects/Caustics'
export { MeshTransmissionMaterial } from '../webgpu/Materials/MeshTransmissionMaterial'
export { MeshReflectorMaterial } from '../webgpu/Materials/MeshReflectorMaterial'
export { MeshRefractionMaterial } from '../webgpu/Materials/MeshRefractionMaterial'
export { MeshPortalMaterial } from '../webgpu/Materials/MeshPortalMaterial'
export { MeshDistortMaterial } from '../webgpu/Materials/MeshDistortMaterial'
export { MeshWobbleMaterial } from '../webgpu/Materials/MeshWobbleMaterial'
export { FakeCloudMaterial as CloudMaterial } from '../webgpu/Materials/FakeCloudMaterial'
// Note: StarfieldMaterial not exported here - Stars component is platform-specific (not aliased)
// Note: SparklesMaterial not exported here - Sparkles component is platform-specific (not aliased)

//* Effects & Helpers --------------------------------
export { Outlines } from '../webgpu/Effects/Outlines'

//* Platform-specific Three.js classes --------------------------------
export { RenderTarget } from 'three/webgpu'
// WebGPU: CubeRenderTarget exists in three/src/renderers/common/ but isn't exported yet
// TODO: Switch to `export { CubeRenderTarget } from 'three/webgpu'` when Three.js exports it
export { WebGLCubeRenderTarget as CubeRenderTarget } from 'three/webgpu'

//* Portal --------------------------------
export { RenderTexture } from '@core/Portal/RenderTexture'
export { RenderCubeTexture } from '../core/Portal/RenderCubeTexture'
export { Hud } from '../core/Portal/Hud'

// Add more split components here as needed

