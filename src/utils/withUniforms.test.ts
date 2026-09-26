import { describe, expect, it } from 'vitest'
import { Color, Matrix4, MeshBasicNodeMaterial } from 'three/webgpu'
import type { Material, Node } from 'three/webgpu'
import { uniform, vec4 } from 'three/tsl'
import { withUniforms } from './withUniforms'
import { SparklesMaterial } from '@webgpu/Materials/SparklesMaterial'
import { SpotLightMaterial } from '@webgpu/Materials/SpotLightMaterial/SpotLightMaterial'
import { MeshReflectorMaterial } from '@webgpu/Materials/MeshReflectorMaterial/MeshReflectorMaterialClass'
import { WireframeMaterialImpl } from '@webgpu/Materials/WireframeMaterial/WireframeMaterial'
import { ConvolutionMaterial } from '@webgpu/Materials/ConvolutionMaterial/ConvolutionMaterial'
import { CausticsMaterial, CausticsProjectionMaterial } from '@webgpu/Effects/Caustics/Caustics'

// Not wired into `yarn test` yet. Run with a node vitest config that maps the
// tsconfig aliases (`@webgpu`, `@utils`, `#three` -> three/webgpu).

/** True when `target` is reachable from `root` through the node graph. */
function graphContains(root: Node, target: Node) {
  let found = false
  root.traverse((node) => {
    if (node === target) found = true
  })
  return found
}

/** Own enumerable properties holding TSL nodes: the material's shader graphs. */
function graphKeys(material: Material) {
  return Object.keys(material).filter((key) => (material as any)[key]?.isNode)
}

// A small material built on the helper, so the test is about withUniforms itself.
// The graph is built without Fn() so Node.traverse can reach the uniform nodes.
class ExampleMaterial extends withUniforms(MeshBasicNodeMaterial, {
  strength: () => uniform(1),
  tint: () => uniform(new Color('white')),
}) {
  constructor(parameters: ConstructorParameters<typeof MeshBasicNodeMaterial>[0] = {}) {
    super(parameters)
    const { strength, tint } = this.uniforms
    this.colorNode = vec4(tint.mul(strength), 1)
  }
}

describe('withUniforms clone()', () => {
  it('clones without throwing and carries the uniform values across', () => {
    const original = new ExampleMaterial({ strength: 2, tint: 'red' })
    let clone!: ExampleMaterial
    expect(() => (clone = original.clone())).not.toThrow()

    expect(clone).toBeInstanceOf(ExampleMaterial)
    expect(clone.strength).toBe(2)
    expect(clone.tint.getHex()).toBe(0xff0000)
    expect(clone.tint).not.toBe(original.tint)
  })

  it('gives the clone its own uniform nodes', () => {
    const original = new ExampleMaterial({ strength: 2 })
    const clone = original.clone()

    expect(clone.uniforms).not.toBe(original.uniforms)
    expect(clone.uniforms.strength).not.toBe(original.uniforms.strength)
    expect(clone.uniforms.tint).not.toBe(original.uniforms.tint)

    clone.strength = 5
    clone.tint = 'blue'
    expect(original.strength).toBe(2)
    expect(original.tint.getHex()).toBe(0xffffff)
  })

  it('binds the clone shader graph to the clone uniforms, not the original ones', () => {
    const original = new ExampleMaterial({ strength: 2 })
    const clone = original.clone()

    // If NodeMaterial.copy() handed the original's graph to the clone, the clone
    // would render with the original's uniform nodes: setting clone.strength
    // would change nothing on screen and setting original.strength would move both.
    expect(clone.colorNode).not.toBe(original.colorNode)
    expect(graphContains(clone.colorNode as Node, clone.uniforms.strength)).toBe(true)
    expect(graphContains(clone.colorNode as Node, clone.uniforms.tint)).toBe(true)
    expect(graphContains(clone.colorNode as Node, original.uniforms.strength)).toBe(false)
    expect(graphContains(clone.colorNode as Node, original.uniforms.tint)).toBe(false)
  })

  it('copy() onto an existing instance keeps that instance graph and takes the values', () => {
    const a = new ExampleMaterial({ strength: 1 })
    const b = new ExampleMaterial({ strength: 3, tint: 'green' })
    const aGraph = a.colorNode

    a.copy(b)

    expect(a.strength).toBe(3)
    expect(a.tint.getHex()).toBe(0x008000)
    expect(a.colorNode).toBe(aGraph)
    expect(graphContains(a.colorNode as Node, a.uniforms.strength)).toBe(true)
    expect(graphContains(a.colorNode as Node, b.uniforms.strength)).toBe(false)
  })

  it('still shares graphs assigned after construction, as three does', () => {
    const original = new ExampleMaterial()
    const custom = vec4(1, 0, 0, 1)
    original.opacityNode = custom
    const clone = original.clone()

    expect(clone.opacityNode).toBe(custom)
  })
})

//* Every withUniforms material class the webgpu entry exports ==============================

type Row = {
  name: string
  create: () => Material
  key: string
  write?: (material: any, n: number) => void
  read?: (material: any) => number
}

const scalar = (name: string, create: () => Material, key: string): Row => ({ name, create, key })

const rows: Row[] = [
  scalar('SparklesMaterial', () => new SparklesMaterial(), 'time'),
  scalar('SpotLightMaterial', () => new SpotLightMaterial(), 'attenuation'),
  scalar('MeshReflectorMaterial', () => new MeshReflectorMaterial(), 'mixStrength'),
  scalar('WireframeMaterialImpl', () => new WireframeMaterialImpl(), 'thickness'),
  scalar('ConvolutionMaterial', () => new ConvolutionMaterial(), 'scale'),
  scalar('CausticsMaterial', () => new CausticsMaterial(), 'intensity'),
  {
    name: 'CausticsProjectionMaterial',
    create: () => new CausticsProjectionMaterial(),
    key: 'lightProjMatrix',
    write: (m, n) => (m.lightProjMatrix = new Matrix4().makeScale(n, n, n)),
    read: (m) => m.lightProjMatrix.elements[0],
  },
]

describe.each(rows)('$name', ({ create, key, write, read }) => {
  const set = write ?? ((m, n) => (m[key] = n))
  const get = read ?? ((m) => m[key])

  it('clones with independent uniforms and its own shader graphs', () => {
    const original: any = create()
    set(original, 0.25)

    let clone: any
    expect(() => (clone = original.clone())).not.toThrow()

    expect(clone).toBeInstanceOf(original.constructor)
    expect(get(clone)).toBe(0.25)
    expect(clone.uniforms[key]).not.toBe(original.uniforms[key])

    set(clone, 0.75)
    expect(get(original)).toBe(0.25)
    expect(get(clone)).toBe(0.75)

    const graphs = graphKeys(original)
    expect(graphs.length).toBeGreaterThan(0)
    for (const graph of graphs) expect(clone[graph], graph).not.toBe(original[graph])
  })
})
