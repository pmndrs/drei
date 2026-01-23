//* Native Entry Point ==============================
// This entry exports drei components for React Native with WebGPU aliasing.
// When built, all #three imports resolve to 'three/webgpu'.
//
// IMPORTANT: Some components don't work on React Native and are excluded.
// Importing them will throw when rendered.
//
// Usage: import { Box, MeshDistortMaterial } from '@react-three/drei/native'

//* Re-export everything from webgpu (includes core) ==============================
export * from '../webgpu'

//* Exclusions - Override unsupported components ==============================
// Named exports shadow star exports in ES modules.
// These are stubs that throw helpful errors when someone tries to use them.

function createUnsupported(name: string, reason: string) {
  const UnsupportedComponent = () => {
    throw new Error(`[drei/native] ${name} is not supported: ${reason}`)
  }
  UnsupportedComponent.displayName = `Unsupported(${name})`
  return UnsupportedComponent
}

// DOM-dependent components
export const Html = /* @__PURE__ */ createUnsupported(
  'Html',
  'requires DOM which is not available on React Native'
)

// Controls requiring DOM pointer/keyboard events
export const ArcballControls = /* @__PURE__ */ createUnsupported(
  'ArcballControls',
  'requires DOM pointer events not available on React Native'
)
export const DragControls = /* @__PURE__ */ createUnsupported(
  'DragControls',
  'requires DOM pointer events not available on React Native'
)
export const FirstPersonControls = /* @__PURE__ */ createUnsupported(
  'FirstPersonControls',
  'requires DOM pointer events not available on React Native'
)
export const FlyControls = /* @__PURE__ */ createUnsupported(
  'FlyControls',
  'requires DOM pointer events not available on React Native'
)
export const KeyboardControls = /* @__PURE__ */ createUnsupported(
  'KeyboardControls',
  'requires keyboard events not available on React Native'
)
export const MapControls = /* @__PURE__ */ createUnsupported(
  'MapControls',
  'requires DOM pointer events not available on React Native'
)
export const OrbitControls = /* @__PURE__ */ createUnsupported(
  'OrbitControls',
  'requires DOM pointer events not available on React Native'
)
export const PointerLockControls = /* @__PURE__ */ createUnsupported(
  'PointerLockControls',
  'requires Pointer Lock API not available on React Native'
)
export const ScrollControls = /* @__PURE__ */ createUnsupported(
  'ScrollControls',
  'requires DOM scroll events not available on React Native'
)
export const TrackballControls = /* @__PURE__ */ createUnsupported(
  'TrackballControls',
  'requires DOM pointer events not available on React Native'
)

// Complex effects not yet supported on native
export const Caustics = /* @__PURE__ */ createUnsupported('Caustics', 'not yet supported on React Native')
