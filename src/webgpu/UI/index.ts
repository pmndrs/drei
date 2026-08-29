export * from './Image'
// Text is not available on the WebGPU entry. It depended on a vendored troika
// fork that could never be published to npm, and upstream troika ships no
// WebGPU build. Removed rather than carried; it returns via @pmndrs/glyph,
// which covers both renderers. Tracked in #2658.
//
// This matches 11.0.0-alpha.5, which also exported no Text from /webgpu.
// WebGL Text is unaffected — still exported from @react-three/drei/legacy.
