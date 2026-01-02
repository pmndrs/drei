//* Drei Platform Components - WebGPU Version ==============================
// This file re-exports drei components that have separate WebGL/WebGPU implementations.
// For WebGPU builds, this file is used via the #drei-platform alias.
// Core components can import from here to get platform-appropriate implementations.

//* Shadows --------------------------------
export { ContactShadows } from '../webgpu/Materials/ContactShadows'
export type { ContactShadowsProps } from '../webgpu/Materials/ContactShadows'

export { AccumulativeShadows, RandomizedLight } from '../webgpu/Materials/AccumulativeShadows'
export type { AccumulativeShadowsProps, RandomizedLightProps } from '../webgpu/Materials/AccumulativeShadows'

//* Materials --------------------------------
export { Caustics } from '../webgpu/Materials/Caustics'
export { MeshTransmissionMaterial } from '../webgpu/Materials/MeshTransmissionMaterial'
export { MeshReflectorMaterial } from '../webgpu/Materials/MeshReflectorMaterial'
export { MeshRefractionMaterial } from '../webgpu/Materials/MeshRefractionMaterial'
export { MeshPortalMaterial } from '../webgpu/Materials/MeshPortalMaterial'
export { MeshDistortMaterial } from '../webgpu/Materials/MeshDistortMaterial'
export { MeshWobbleMaterial } from '../webgpu/Materials/MeshWobbleMaterial'

//* Effects & Helpers --------------------------------
export { Outlines } from '../webgpu/Materials/Outlines'
export { Effects } from '../webgpu/Abstractions/Effects'

//* Platform-specific Three.js classes --------------------------------
export { RenderTarget } from 'three/webgpu'

//* Portal --------------------------------
export { RenderTexture } from '../webgpu/Portal/RenderTexture'
export { RenderCubeTexture } from '../webgpu/Portal/RenderCubeTexture'
export { Hud } from '../webgpu/Portal/Hud'

//* Cameras --------------------------------
export { CubeCamera } from '../webgpu/Cameras/CubeCamera'

// Add more split components here as needed

