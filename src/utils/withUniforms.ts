import type { Material, Texture, TextureNode, UniformNode } from 'three/webgpu'

type AnyCtor = new (...args: any[]) => Material

/** Creates a fresh uniform node for each material instance. */
export type UniformFactory = () => UniformNode<any, any> | TextureNode

/** Reserved names include base material properties, Three internals, and `uniforms`. */
export type ReservedUniformName<B extends AnyCtor> = keyof InstanceType<B> | `_${string}` | 'uniforms'

/** Uniform factories with reserved property names excluded. */
export type UniformTable<B extends AnyCtor, U> = {
  [K in keyof U]: K extends ReservedUniformName<B> ? never : UniformFactory
}

/** The value exposed by a uniform factory. Null textures reset to a placeholder. */
export type UniformValue<F> = F extends () => TextureNode
  ? Texture | null
  : F extends () => UniformNode<any, infer V>
    ? V
    : never

type UniformProps<U> = { [K in keyof U]: UniformValue<U[K]> }
type UniformNodes<U extends Record<string, UniformFactory>> = { [K in keyof U]: ReturnType<U[K]> }

/** The base constructor's parameters object, widened so uniform values can be passed to `new`. */
type UniformParameters<B extends AnyCtor, U> = NonNullable<ConstructorParameters<B>[0]> & Partial<UniformProps<U>>

export type WithUniforms<B extends AnyCtor, U extends Record<string, UniformFactory>> = Omit<B, 'prototype'> & {
  new (
    parameters?: UniformParameters<B, U>,
    ...rest: any[]
  ): InstanceType<B> & UniformProps<U> & { readonly uniforms: UniformNodes<U> }
}

/** Assigns values, including color representations and math arrays. */
function assignUniform(node: UniformNode<any, any> | TextureNode, factory: UniformFactory, v: unknown) {
  const current: any = node.value
  if (v === null || v === undefined) {
    // Texture nodes require a texture, including before an R3F attachment.
    if (current && current.isTexture) node.value = (factory() as TextureNode).value
    else node.value = v as any
    return
  }
  if (typeof current === 'number') {
    node.value = typeof v === 'boolean' ? (v ? 1 : 0) : (v as number)
    return
  }
  if (typeof current === 'boolean') {
    node.value = !!v
    return
  }
  if (current && typeof current === 'object') {
    // Object assignments keep their reference. Array and scalar inputs update the current value.
    if (typeof v === 'object' && !Array.isArray(v)) {
      node.value = v as any
      return
    }
    if (Array.isArray(v) && typeof current.fromArray === 'function') {
      current.fromArray(v)
      return
    }
    if (current.isColor) {
      current.set(v)
      return
    }
    if (typeof v === 'number' && typeof current.setScalar === 'function') {
      current.setScalar(v)
      return
    }
  }
  node.value = v as any
}

/**
 * Exposes custom TSL uniforms as material properties. Build shaders from `this.uniforms`.
 * Use Three's material nodes for built-in properties.
 * Create new instances for independent uniforms. `clone()` and `copy()` share shader graphs.
 *
 * @example
 * class PortalMaterial extends withUniforms(MeshBasicNodeMaterial, {
 *   blur: () => uniform(0),
 *   resolution: () => uniform(new Vector2()),
 * }) {
 *   constructor() {
 *     super()
 *     const { blur } = this.uniforms
 *     this.colorNode = Fn(() => vec4(blur, 0, 0, 1))()
 *   }
 * }
 * const m = new PortalMaterial({ blur: 0.5 })
 * m.blur = 0.2
 * m.uniforms.resolution.value.set(1, 2)
 */
export function withUniforms<B extends AnyCtor, U extends Record<string, UniformFactory>>(
  Base: B,
  table: UniformTable<B, U> & U
): WithUniforms<B, U> {
  const keys = Object.keys(table)
  const factories = table as Record<string, UniformFactory>
  let installed = false

  const install = (instance: object) => {
    // Check after super() so the base material's assigned properties are visible.
    for (const key of keys) {
      if (key.startsWith('_') || key in instance) {
        throw new Error(
          `withUniforms: "${key}" is reserved on ${Base.name}. ` +
            `Read three's own node for it (materialOpacity, materialColor, materialReference(...)) instead of declaring a uniform named "${key}".`
        )
      }
    }
    for (const key of keys) {
      Object.defineProperty(Wrapped.prototype, key, {
        get(this: any) {
          return this._uniforms?.[key]?.value
        },
        set(this: any, v: unknown) {
          const node = this._uniforms?.[key]
          if (node) assignUniform(node, factories[key], v)
        },
        enumerable: false,
        configurable: true,
      })
    }
    installed = true
  }

  const splitParameters = (args: any[]) => {
    // three's `setValues` runs inside `super()` and warns about keys it does not
    // know, so uniform values are withheld from it and applied afterwards.
    const params = args[0]
    if (!params || typeof params !== 'object' || Array.isArray(params)) return { args, own: null }
    const own: Record<string, unknown> = {}
    const rest: Record<string, unknown> = {}
    let hasOwn = false
    for (const k in params) {
      if (Object.prototype.hasOwnProperty.call(factories, k)) {
        own[k] = params[k]
        hasOwn = true
      } else rest[k] = params[k]
    }
    return hasOwn ? { args: [rest, ...args.slice(1)], own } : { args, own: null }
  }

  class Wrapped extends Base {
    declare readonly _uniforms: Record<string, UniformNode<any, any> | TextureNode>

    constructor(...args: any[]) {
      const { args: baseArgs, own } = splitParameters(args)
      super(...baseArgs)
      if (!installed) install(this)
      const nodes: Record<string, UniformNode<any, any> | TextureNode> = {}
      for (const key of keys) nodes[key] = factories[key]()
      // Non-enumerable so NodeMaterial.copy() does not share it between clones
      Object.defineProperty(this, '_uniforms', { value: nodes, enumerable: false, writable: false })
      if (own) for (const key in own) (this as any)[key] = own[key]
    }

    get uniforms() {
      return this._uniforms
    }

    /** Copies values for inherited accessors that NodeMaterial.copy does not visit. */
    copy(source: this): this {
      super.copy(source)
      const from = (source as any)._uniforms as Record<string, UniformNode<any, any> | TextureNode> | undefined
      if (!from) return this
      for (const key of keys) {
        const value: any = from[key]?.value
        const node = this._uniforms[key]
        const own: any = node.value
        // Share textures and copy math values, matching Three's material properties.
        if (value && value.isTexture) node.value = value
        else if (own && typeof own.copy === 'function') own.copy(value)
        else node.value = value
      }
      return this
    }
  }

  return Wrapped as unknown as WithUniforms<B, U>
}
