//* Drei Platform Components - WebGL Version ==============================
// This file re-exports drei components that have separate WebGL/WebGPU implementations.
// For WebGL builds, this file is used via the #drei-platform alias.
// Core components can import from here to get platform-appropriate implementations.

//* Shadows --------------------------------
export { ContactShadows } from '../legacy/Materials/ContactShadows'
export type { ContactShadowsProps } from '../legacy/Materials/ContactShadows'

export { AccumulativeShadows, RandomizedLight } from '../legacy/Materials/AccumulativeShadows'
export type { AccumulativeShadowsProps, RandomizedLightProps } from '../legacy/Materials/AccumulativeShadows'

//* Materials --------------------------------
export { Caustics } from '../legacy/Materials/Caustics'
export { MeshTransmissionMaterial } from '../legacy/Materials/MeshTransmissionMaterial'
export { MeshReflectorMaterial } from '../legacy/Materials/MeshReflectorMaterial'
export { MeshRefractionMaterial } from '../legacy/Materials/MeshRefractionMaterial'
export { MeshPortalMaterial } from '../legacy/Materials/MeshPortalMaterial'
export { MeshDistortMaterial } from '../legacy/Materials/MeshDistortMaterial'
export { MeshWobbleMaterial } from '../legacy/Materials/MeshWobbleMaterial'
export { CloudMaterial } from '../legacy/Materials/CloudMaterial'
// Note: StarfieldMaterial not exported here - Stars component is platform-specific (not aliased)
// Note: SparklesMaterial not exported here - Sparkles component is platform-specific (not aliased)

//* Effects & Helpers --------------------------------
export { Outlines } from '../experimental/Effects/Outlines'
export { Effects } from '../legacy/Abstractions/Effects'

//* Platform-specific Three.js classes --------------------------------
export { WebGLRenderTarget as RenderTarget } from 'three'
// WebGL uses WebGLCubeRenderTarget directly
export { WebGLCubeRenderTarget as CubeRenderTarget } from 'three'

//* Portal --------------------------------
export { RenderTexture } from '../legacy/Portal/RenderTexture'
export { RenderCubeTexture } from '../legacy/Portal/RenderCubeTexture'
export { Hud } from '../legacy/Portal/Hud'

//* Geometry --------------------------------
export { Line } from '../legacy/Geometry/Line'
export type { LineProps } from '../legacy/Geometry/Line'
export { Segments, Segment, SegmentObject } from '../legacy/Geometry/Segments'
export type { SegmentsProps, SegmentProps } from '../legacy/Geometry/Segments'

//* Effects --------------------------------
export { Trail, useTrail } from '../legacy/Effects/Trail'
export type { TrailProps } from '../legacy/Effects/Trail'

// Add more split components here as needed
