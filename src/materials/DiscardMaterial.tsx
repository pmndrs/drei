import { shaderMaterial } from '../core/shaderMaterial'

export const DiscardMaterial = shaderMaterial({}, 'void main() { }', 'void main() { discard; }')
