import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { Position } from '../helpers/Position'

type Api = {
  subscribe: (ref) => void
}

type InstancesProps = JSX.IntrinsicElements['instancedMesh'] & {
  range?: number
  limit?: number
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.BufferAttribute
  instanceColor: THREE.BufferAttribute
}

let i, instanceRef
const context = React.createContext<Api>(null!)
const parentMatrix = new THREE.Matrix4()
const instanceMatrix = new THREE.Matrix4()
const tempMatrix = new THREE.Matrix4()
const color = new THREE.Color()
const translation = new THREE.Vector3()
const rotation = new THREE.Quaternion()
const scale = new THREE.Vector3()

const Instances = React.forwardRef(
  ({ children, range, limit = 1000, ...props }: InstancesProps, ref: React.ForwardedRef<THREE.InstancedMesh>) => {
    const parentRef = React.useRef<InstancedMesh>(null!)
    const [instances, setInstances] = React.useState<React.MutableRefObject<Position>[]>([])
    const [[matrices, colors]] = React.useState(() => {
      const mArray = new Float32Array(limit * 16)
      for (i = 0; i < limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
      return [mArray, new Float32Array([...new Array(limit * 3)].map(() => 1))]
    })

    React.useLayoutEffect(() => {
      parentRef.current.count =
        parentRef.current.instanceMatrix.updateRange.count =
        parentRef.current.instanceColor.updateRange.count =
          Math.min(limit, range !== undefined ? range : limit, instances.length)
    }, [instances, range])

    React.useEffect(() => {
      // We might be a frame too late? 🤷‍♂️
      parentRef.current.instanceMatrix.needsUpdate = true
    })

    useFrame((state) => {
      parentRef.current.updateMatrix()
      parentRef.current.updateMatrixWorld()
      parentMatrix.copy(parentRef.current.matrixWorld).invert()
      for (i = 0; i < instances.length; i++) {
        instanceRef = instances[i].current
        // Multiply the inverse of the InstancedMesh world matrix or else
        // Instances will be double-transformed if <Instances> isn't at identity
        instanceRef.matrixWorld.decompose(translation, rotation, scale)
        instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix)
        if (!instanceMatrix.equals(tempMatrix.fromArray(matrices, i * 16))) {
          instanceMatrix.toArray(matrices, i * 16)
          parentRef.current.instanceMatrix.needsUpdate = true
        }

        if (!instanceRef.color.equals(color.fromArray(colors, i * 3))) {
          instanceRef.color.toArray(colors, i * 3)
          parentRef.current.instanceColor.needsUpdate = true
        }
      }
    })

    const events = React.useMemo(() => {
      const events = {}
      for (i = 0; i < instances.length; i++) Object.assign(events, (instances[i].current as any)?.__r3f.handlers)
      return Object.keys(events).reduce(
        (prev, key) => ({
          ...prev,
          [key]: (e) => (instances[e.instanceId].current as any)?.__r3f?.handlers?.[key](e),
        }),
        {}
      )
    }, [instances])

    const api = React.useMemo(
      () => ({
        subscribe: (ref) => {
          setInstances((instances) => [...instances, ref])
          return () => setInstances((instances) => instances.filter((item) => item.current !== ref.current))
        },
      }),
      []
    )

    return (
      <instancedMesh
        matrixAutoUpdate={false}
        ref={mergeRefs([ref, parentRef])}
        args={[null as any, null as any, 0]}
        {...events}
        {...props}
      >
        <instancedBufferAttribute attach="instanceMatrix" count={matrices.length / 16} array={matrices} itemSize={16} />
        <instancedBufferAttribute attach="instanceColor" count={colors.length / 3} array={colors} itemSize={3} />
        <context.Provider value={api}>{children}</context.Provider>
      </instancedMesh>
    )
  }
)

const Instance = React.forwardRef(({ children, ...props }, ref) => {
  React.useMemo(() => extend({ Position }), [])
  const group = React.useRef()
  const { subscribe } = React.useContext(context)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <position ref={mergeRefs([ref, group])} {...props}>
      {children}
    </position>
  )
})

export { Instances, Instance }
