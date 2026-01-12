//* Three.js Addons - WebGPU Version ==============================
// This file re-exports Three.js addons that have separate WebGL/WebGPU implementations.
// For WebGPU builds, this file is used via the #three-addons alias.
// Non-split addons (like GLTFLoader) should be imported directly from three/examples/jsm/

//* Lines --------------------------------
export { Line2 } from 'three/examples/jsm/lines/webgpu/Line2.js'
export { LineSegments2 } from 'three/examples/jsm/lines/webgpu/LineSegments2.js'
export { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
export { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
export { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

// Add more split addons here as Three.js adds them
