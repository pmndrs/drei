import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import Composer from 'react-composer'
import { Position } from '../helpers/Position'

type Api = {
  getParent: () => React.MutableRefObject<InstancedMesh>
  subscribe: (ref) => void
}

type InstancesProps = JSX.IntrinsicElements['instancedMesh'] & {
  range?: number
  limit?: number
  frames?: number
}

type InstanceProps = JSX.IntrinsicElements['position'] & {
  context?: React.Context<Api>
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.InstancedBufferAttribute
  instanceColor: THREE.InstancedBufferAttribute
}

let i, instanceRef
const globalContext = React.createContext<Api>(null!)
const parentMatrix = new THREE.Matrix4()
const instanceMatrix = new THREE.Matrix4()
const tempMatrix = new THREE.Matrix4()
const color = new THREE.Color()
const translation = new THREE.Vector3()
const rotation = new THREE.Quaternion()
const scale = new THREE.Vector3()

const Instance = React.forwardRef(({ context, children, ...props }: InstanceProps, ref) => {
  React.useMemo(() => extend({ Position }), [])
  const group = React.useRef<JSX.IntrinsicElements['position']>()
  const { subscribe, getParent } = React.useContext(context || globalContext)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <position instance={getParent()} instanceKey={group} ref={mergeRefs([ref, group])} {...props}>
      {children}
    </position>
  )
})

const Instances = React.forwardRef<InstancedMesh, InstancesProps>(
  ({ children, range, limit = 1000, frames = Infinity, ...props }, ref) => {
    const [{ context, instance }] = React.useState(() => {
      const context = React.createContext<Api>(null!)
      return {
        context,
        instance: React.forwardRef((props: InstanceProps, ref) => <Instance context={context} {...props} ref={ref} />),
      }
    })

    const parentRef = React.useRef<InstancedMesh>(null!)
    const [instances, setInstances] = React.useState<React.MutableRefObject<Position>[]>([])
    const [[matrices, colors]] = React.useState(() => {
      const mArray = new Float32Array(limit * 16)
      for (i = 0; i < limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
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

        for (i = 0; i < instances.length; i++) {
          instanceRef = instances[i].current
          // Multiply the inverse of the InstancedMesh world matrix or else
          // Instances will be double-transformed if <Instances> isn't at identity
          instanceRef.matrixWorld.decompose(translation, rotation, scale)
          instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix)
          instanceMatrix.toArray(matrices, i * 16)
          parentRef.current.instanceMatrix.needsUpdate = true
          instanceRef.color.toArray(colors, i * 3)
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

function Merged({ meshes, children, ...props }) {
  const isArray = Array.isArray(meshes)
  // Filter out meshes from collections, which may contain non-meshes
  if (!isArray) for (const key of Object.keys(meshes)) if (!meshes[key].isMesh) delete meshes[key]
  return (
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
  )
}

export { Instances, Instance, Merged }
