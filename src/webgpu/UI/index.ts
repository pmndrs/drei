export * from './Image'
// Text is intentionally absent from the WebGPU entry: it depended on a vendored
// troika fork that cannot be published to npm (a file: tarball dependency), and
// upstream troika ships no WebGPU build. Returning via @pmndrs/glyph in a later
// alpha. WebGL Text is unaffected — still exported from @react-three/drei/legacy.
// This matches 11.0.0-alpha.5, which also exported no Text from /webgpu.
