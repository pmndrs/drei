import { shaderMaterial } from '@legacy/Materials/shaderMaterial'

export const DiscardMaterial = /* @__PURE__ */ shaderMaterial(
  {},
  'void main() { }',
  'void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); discard;  }'
)
