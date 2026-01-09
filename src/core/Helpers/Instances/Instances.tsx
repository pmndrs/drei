import * as THREE from '#three'
import * as React from 'react'
import { ThreeElement, ThreeElements, extend, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '../../../utils/ts-utils'
import { setUpdateRange } from '../../../utils/deprecated'

declare module '@react-three/fiber' {
  interface ThreeElements {
    positionMesh: ThreeElement<typeof PositionMesh>
  }
}

type Api = {
  getParent: () => React.RefObject<InstancedMesh>
  subscribe: <T>(ref: React.RefObject<T>) => void
}

export type InstancesProps = Omit<ThreeElements['instancedMesh'], 'ref' | 'args'> & {
  context?: React.Context<Api>
  range?: number
  limit?: number
  frames?: number
}

export type InstanceProps = Omit<ThreeElements['positionMesh'], 'ref'> & {
  context?: React.Context<Api>
}

export type InstancedAttributeProps = Omit<ThreeElements['instancedBufferAttribute'], 'ref' | 'args'> & {
  name: string
  defaultValue: any
  normalized?: boolean
  usage?: number
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.InstancedBufferAttribute
  instanceColor: THREE.InstancedBufferAttribute
}

function isFunctionChild(
  value: any
): value is (
  props: React.ForwardRefExoticComponent<Omit<InstanceProps, 'ref'> & React.RefAttributes<unknown>>
) => React.ReactNode {
  return typeof value === 'function'
}

const _instanceLocalMatrix = /* @__PURE__ */ new THREE.Matrix4()
const _instanceWorldMatrix = /* @__PURE__ */ new THREE.Matrix4()
const _instanceIntersects: THREE.Intersection[] = []
const _mesh = /* @__PURE__ */ new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>()

export class PositionMesh extends THREE.Group {
  color: THREE.Color
  instance: React.RefObject<THREE.InstancedMesh | undefined>
  instanceKey: React.RefObject<PositionMesh | undefined>
  constructor() {
    super()
    this.color = new THREE.Color('white')
    this.instance = { current: undefined }
    this.instanceKey = { current: undefined }
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance.current?.geometry
  }

  // And this will allow the virtual instance to receive events
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    const parent = this.instance.current
    if (!parent) return
    if (!parent.geometry || !parent.material) return
    _mesh.geometry = parent.geometry
    const matrixWorld = parent.matrixWorld
    const instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.count) return
    // calculate the world matrix for each instance
    parent.getMatrixAt(instanceId, _instanceLocalMatrix)
    _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix)
    // the mesh represents this single instance
    _mesh.matrixWorld = _instanceWorldMatrix
    // raycast side according to instance material
    if (parent.material instanceof THREE.Material) _mesh.material.side = parent.material.side
    else _mesh.material.side = parent.material[0].side
    _mesh.raycast(raycaster, _instanceIntersects)
    // process the result of raycast
    for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
      const intersect = _instanceIntersects[i]
      intersect.instanceId = instanceId
      intersect.object = this
      intersects.push(intersect)
    }
    _instanceIntersects.length = 0
  }
}

const globalContext = /* @__PURE__ */ React.createContext<Api>(null!)
const parentMatrix = /* @__PURE__ */ new THREE.Matrix4()
const instanceMatrix = /* @__PURE__ */ new THREE.Matrix4()
const tempMatrix = /* @__PURE__ */ new THREE.Matrix4()
const translation = /* @__PURE__ */ new THREE.Vector3()
const rotation = /* @__PURE__ */ new THREE.Quaternion()
const scale = /* @__PURE__ */ new THREE.Vector3()

const isInstancedBufferAttribute = (attr: any): attr is THREE.InstancedBufferAttribute =>
  attr.isInstancedBufferAttribute

/**
 * A single instance within an Instances container.
 * Supports transform props, colors, and events.
 */
export const Instance = /* @__PURE__ */ React.forwardRef(({ context, children, ...props }: InstanceProps, ref) => {
  React.useMemo(() => extend({ PositionMesh }), [])
  const group = React.useRef<PositionMesh>(null!)
  React.useImperativeHandle(ref, () => group.current, [])
  const { subscribe, getParent } = React.useContext<Api>(context || globalContext)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <positionMesh instance={getParent()} instanceKey={group} ref={group} {...props}>
      {children}
    </positionMesh>
  )
})

/**
 * Declarative wrapper for THREE.InstancedMesh. Render thousands of objects in a single draw call.
 * Children can include Instance components that share the same geometry and material.
 *
 * @example Basic instances
 * ```jsx
 * <Instances limit={1000}>
 *   <boxGeometry />
 *   <meshStandardMaterial />
 *   <Instance color="red" position={[1, 0, 0]} />
 *   <Instance color="blue" position={[-1, 0, 0]} />
 * </Instances>
 * ```
 */
export const Instances: ForwardRefComponent<InstancesProps, THREE.InstancedMesh> = /* @__PURE__ */ React.forwardRef<
  THREE.InstancedMesh,
  InstancesProps
>(({ context, children, range, limit = 1000, frames = Infinity, ...props }, ref) => {
  const [{ localContext, instance }] = React.useState(() => {
    const localContext = React.createContext<Api>(null!)
    return {
      localContext,
      instance: React.forwardRef((props: InstanceProps, ref) => (
        <Instance context={localContext} {...props} ref={ref} />
      )),
    }
  })

  const parentRef = React.useRef<InstancedMesh>(null!)
  React.useImperativeHandle(ref, () => parentRef.current, [])
  const [instances, setInstances] = React.useState<React.RefObject<PositionMesh>[]>([])
  const [[matrices, colors]] = React.useState(() => {
    const mArray = new Float32Array(limit * 16)
    for (let i = 0; i < limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
    return [mArray, new Float32Array([...new Array(limit * 3)].map(() => 1))]
  })

  React.useEffect(() => {
    // We might be a frame too late? 🤷‍♂️
    parentRef.current.instanceMatrix.needsUpdate = true
  })

  let iterations = 0
  let count = 0

  const attributes = React.useRef<[string, THREE.InstancedBufferAttribute][]>([])
  React.useLayoutEffect(() => {
    attributes.current = Object.entries(parentRef.current.geometry.attributes).filter(([_name, value]) =>
      isInstancedBufferAttribute(value)
    ) as [string, THREE.InstancedBufferAttribute][]
  })

  useFrame(() => {
    if (frames === Infinity || iterations < frames) {
      parentRef.current.updateMatrix()
      parentRef.current.updateMatrixWorld()
      parentMatrix.copy(parentRef.current.matrixWorld).invert()

      count = Math.min(limit, range !== undefined ? range : limit, instances.length)
      parentRef.current.count = count
      setUpdateRange(parentRef.current.instanceMatrix, { start: 0, count: count * 16 })
      setUpdateRange(parentRef.current.instanceColor, { start: 0, count: count * 3 })

      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i].current
        // Multiply the inverse of the InstancedMesh world matrix or else
        // Instances will be double-transformed if <Instances> isn't at identity
        instance.matrixWorld.decompose(translation, rotation, scale)
        instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix)
        instanceMatrix.toArray(matrices, i * 16)
        parentRef.current.instanceMatrix.needsUpdate = true
        instance.color.toArray(colors, i * 3)
        parentRef.current.instanceColor.needsUpdate = true
      }
      iterations++
    }
  })

  const api = React.useMemo(
    () => ({
      getParent: () => parentRef,
      subscribe: (ref) => {
        setInstances((instances) => [...instances, ref])
        return () => setInstances((instances) => instances.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  return (
    <instancedMesh
      userData={{ instances, limit, frames }}
      matrixAutoUpdate={false}
      ref={parentRef}
      args={[null as any, null as any, 0]}
      raycast={() => null}
      {...props}
    >
      <instancedBufferAttribute attach="instanceMatrix" args={[matrices, 16]} usage={THREE.DynamicDrawUsage} />
      <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} usage={THREE.DynamicDrawUsage} />
      {isFunctionChild(children) ? (
        <localContext.Provider value={api}>{children(instance)}</localContext.Provider>
      ) : context ? (
        <context.Provider value={api}>{children}</context.Provider>
      ) : (
        <globalContext.Provider value={api}>{children}</globalContext.Provider>
      )}
    </instancedMesh>
  )
})

export interface MergedProps extends Omit<InstancesProps, 'children'> {
  meshes: THREE.Mesh[] | Record<string, THREE.Object3D>
  children: (
    ...instances: [React.FC<InstanceProps> & Record<string, React.FC<InstanceProps>>, ...React.FC<InstanceProps>[]]
  ) => React.ReactNode
}

// TODO: make this non-recursive and type-safe
export const Merged: ForwardRefComponent<MergedProps, THREE.Group> = /* @__PURE__ */ React.forwardRef<
  THREE.Group,
  MergedProps
>(function Merged({ meshes, children, ...props }, ref) {
  const isArray = Array.isArray(meshes)
  // Filter out meshes from collections, which may contain non-meshes
  // @ts-expect-error
  if (!isArray) for (const key of Object.keys(meshes)) if (!meshes[key].isMesh) delete meshes[key]

  const render = (args) =>
    isArray
      ? // @ts-expect-error
        children(...args)
      : children(
          // @ts-expect-error
          Object.keys(meshes)
            // @ts-expect-error
            .filter((key) => meshes[key].isMesh)
            .reduce((acc, key, i) => ({ ...acc, [key]: args[i] }), {})
        )

  // @ts-expect-error
  const components = (isArray ? meshes : Object.values(meshes)).map(({ geometry, material }) => (
    <Instances key={geometry.uuid} geometry={geometry} material={material} {...props} />
  ))

  return <group ref={ref}>{renderRecursive(render, components)}</group>
})

// https://github.com/jamesplease/react-composer
function renderRecursive(
  render: Function,
  components: Array<React.ReactElement<{ children: any }> | Function>,
  results: unknown[] = []
): React.ReactElement {
  // Once components is exhausted, we can render out the results array.
  if (!components[0]) {
    return render(results)
  }

  // Continue recursion for remaining items.
  // results.concat([value]) ensures [...results, value] instead of [...results, ...value]
  function nextRender(value) {
    return renderRecursive(render, components.slice(1), results.concat([value]))
  }

  // Each props.components entry is either an element or function [element factory]
  return typeof components[0] === 'function'
    ? // When it is a function, produce an element by invoking it with "render component values".
      components[0]({ results, render: nextRender })
    : // When it is an element, enhance the element's props with the render prop.
      React.cloneElement(components[0], { children: nextRender })
}

/** Idea and implementation for global instances and instanced attributes by
/*  Matias Gonzalez Fernandez https://x.com/matiNotFound
/*  and Paul Henschel https://x.com/0xca0a
*/

/**
 * Creates a dedicated Instances/Instance pair for nested instancing scenarios.
 * Returns [InstancesProvider, InstanceComponent] tuple.
 *
 * @example Nested instances
 * ```jsx
 * const [CubeInstances, Cube] = createInstances()
 * const [SphereInstances, Sphere] = createInstances()
 * <CubeInstances><boxGeometry />
 *   <SphereInstances><sphereGeometry />
 *     <Cube position={[1, 0, 0]} />
 *     <Sphere position={[0, 1, 0]} />
 *   </SphereInstances>
 * </CubeInstances>
 * ```
 */
export function createInstances<T = InstanceProps>() {
  const context = React.createContext<Api>(null!)
  return [
    React.forwardRef<THREE.InstancedMesh, InstancesProps>((props, fref) => (
      <Instances ref={fref} context={context} {...props} />
    )),
    React.forwardRef<PositionMesh & T, T & InstanceProps>((props, fref) => (
      <Instance ref={fref} context={context} {...props} />
    )),
  ] as const
}

/**
 * Creates custom instanced buffer attributes for shaders.
 * Access as vertex attributes in custom materials.
 *
 * @example Custom attribute
 * ```jsx
 * <Instances>
 *   <boxGeometry />
 *   <customMaterial />
 *   <InstancedAttribute name="foo" defaultValue={1} />
 *   <Instance foo={10} />
 * </Instances>
 * ```
 */
export const InstancedAttribute = React.forwardRef(
  ({ name, defaultValue, normalized, usage = THREE.DynamicDrawUsage }: InstancedAttributeProps, fref) => {
    const ref = React.useRef<THREE.InstancedBufferAttribute>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])
    React.useLayoutEffect(() => {
      const parent = (ref.current as any).__r3f.parent.object
      parent.geometry.attributes[name] = ref.current
      const value = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
      const array = Array.from({ length: parent.userData.limit }, () => value).flat()
      ref.current.array = new Float32Array(array)
      ref.current.itemSize = value.length
      // @ts-expect-error
      ref.current.count = array.length / ref.current.itemSize
      return () => {
        delete parent.geometry.attributes[name]
      }
    }, [name])
    let iterations = 0
    useFrame(() => {
      const parent = (ref.current as any).__r3f.parent.object
      if (parent.userData.frames === Infinity || iterations < parent.userData.frames) {
        for (let i = 0; i < parent.userData.instances.length; i++) {
          const instance = parent.userData.instances[i].current
          const value = instance[name]
          if (value !== undefined) {
            ref.current.set(
              Array.isArray(value) ? value : typeof value.toArray === 'function' ? value.toArray() : [value],
              i * ref.current.itemSize
            )
            ref.current.needsUpdate = true
          }
        }
        iterations++
      }
    })
    // @ts-expect-error we're abusing three API here by mutating immutable args
    return <instancedBufferAttribute ref={ref} usage={usage} normalized={normalized} />
  }
)
