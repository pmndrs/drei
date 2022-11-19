import * as THREE from 'three'
import * as React from 'react'
import { ReactThreeFiber, extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import Composer from 'react-composer'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      positionMesh: ReactThreeFiber.Object3DNode<PositionMesh, typeof PositionMesh>
    }
  }
}

type Api = {
  getParent: () => React.MutableRefObject<InstancedMesh>
  subscribe: <T>(ref: React.MutableRefObject<T>) => void
}

export type InstancesProps = JSX.IntrinsicElements['instancedMesh'] & {
  range?: number
  limit?: number
  frames?: number
}

export type InstanceProps = JSX.IntrinsicElements['positionMesh'] & {
  context?: React.Context<Api>
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.InstancedBufferAttribute
  instanceColor: THREE.InstancedBufferAttribute
}

const _instanceLocalMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceWorldMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceIntersects: THREE.Intersection[] = /*@__PURE__*/ []
const _mesh = /*@__PURE__*/ new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>()

class PositionMesh extends THREE.Group {
  color: THREE.Color
  instance: React.MutableRefObject<THREE.InstancedMesh | undefined>
  instanceKey: React.MutableRefObject<JSX.IntrinsicElements['positionMesh'] | undefined>
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

const globalContext = /*@__PURE__*/ React.createContext<Api>(null!)
const parentMatrix = /*@__PURE__*/ new THREE.Matrix4()
const instanceMatrix = /*@__PURE__*/ new THREE.Matrix4()
const tempMatrix = /*@__PURE__*/ new THREE.Matrix4()
const translation = /*@__PURE__*/ new THREE.Vector3()
const rotation = /*@__PURE__*/ new THREE.Quaternion()
const scale = /*@__PURE__*/ new THREE.Vector3()

export const Instance = React.forwardRef(({ context, children, ...props }: InstanceProps, ref) => {
  React.useMemo(() => extend({ PositionMesh }), [])
  const group = React.useRef<JSX.IntrinsicElements['positionMesh']>()
  const { subscribe, getParent } = React.useContext(context || globalContext)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <positionMesh instance={getParent()} instanceKey={group} ref={mergeRefs([ref, group])} {...props}>
      {children}
    </positionMesh>
  )
})

export const Instances = React.forwardRef<InstancedMesh, InstancesProps>(
  ({ children, range, limit = 1000, frames = Infinity, ...props }, ref) => {
    const [{ context, instance }] = React.useState(() => {
      const context = React.createContext<Api>(null!)
      return {
        context,
        instance: React.forwardRef((props: InstanceProps, ref) => <Instance context={context} {...props} ref={ref} />),
      }
    })

    const parentRef = React.useRef<InstancedMesh>(null!)
    const [instances, setInstances] = React.useState<React.MutableRefObject<PositionMesh>[]>([])
    const [[matrices, colors]] = React.useState(() => {
      const mArray = new Float32Array(limit * 16)
      for (let i = 0; i < limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
      return [mArray, new Float32Array([...new Array(limit * 3)].map(() => 1))]
    })

    React.useEffect(() => {
      // We might be a frame too late? 🤷‍♂️
      parentRef.current.instanceMatrix.needsUpdate = true
    })

    let count = 0
    let updateRange = 0
    useFrame(() => {
      if (frames === Infinity || count < frames) {
        parentRef.current.updateMatrix()
        parentRef.current.updateMatrixWorld()
        parentMatrix.copy(parentRef.current.matrixWorld).invert()

        updateRange = Math.min(limit, range !== undefined ? range : limit, instances.length)
        parentRef.current.count = updateRange
        parentRef.current.instanceMatrix.updateRange.count = updateRange * 16
        parentRef.current.instanceColor.updateRange.count = updateRange * 3

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
        count++
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
        userData={{ instances }}
        matrixAutoUpdate={false}
        ref={mergeRefs([ref, parentRef])}
        args={[null as any, null as any, 0]}
        raycast={() => null}
        {...props}
      >
        <instancedBufferAttribute
          attach="instanceMatrix"
          count={matrices.length / 16}
          array={matrices}
          itemSize={16}
          usage={THREE.DynamicDrawUsage}
        />
        <instancedBufferAttribute
          attach="instanceColor"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        {typeof children === 'function' ? (
          <context.Provider value={api}>{children(instance)}</context.Provider>
        ) : (
          <globalContext.Provider value={api}>{children}</globalContext.Provider>
        )}
      </instancedMesh>
    )
  }
)

export interface MergedProps extends InstancesProps {
  meshes: THREE.Mesh[]
  children: React.ReactNode
}

export const Merged = React.forwardRef<THREE.Group, any>(function Merged({ meshes, children, ...props }, ref) {
  const isArray = Array.isArray(meshes)
  // Filter out meshes from collections, which may contain non-meshes
  if (!isArray) for (const key of Object.keys(meshes)) if (!meshes[key].isMesh) delete meshes[key]
  return (
    <group ref={ref}>
      <Composer
        components={(isArray ? meshes : Object.values(meshes)).map(({ geometry, material }) => (
          <Instances key={geometry.uuid} geometry={geometry} material={material} {...props} />
        ))}
      >
        {(args) =>
          isArray
            ? children(...args)
            : children(
                Object.keys(meshes)
                  .filter((key) => meshes[key].isMesh)
                  .reduce((acc, key, i) => ({ ...acc, [key]: args[i] }), {})
              )
        }
      </Composer>
    </group>
  )
})
