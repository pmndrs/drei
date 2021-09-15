import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { Position } from '../helpers/Position'
import { BufferAttribute } from 'three'

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

const context = React.createContext<Api>(null!)
const m = new THREE.Matrix4()
const c = new THREE.Color()
let i

function Instances({ children, range, limit = 1000, ...props }: InstancesProps) {
  const ref = React.useRef<InstancedMesh>(null!)
  const [refs, setRefs] = React.useState<React.MutableRefObject<Position>[]>([])
  const [[matrices, colors]] = React.useState(() => {
    const matrices = [...new Array(limit * 16)].map(() => 0)
    const colors = [...new Array(limit * 3)].map(() => 1)
    return [new Float32Array(matrices), new Float32Array(colors)]
  })

  React.useLayoutEffect(() => {
    ref.current.count =
      ref.current.instanceMatrix.updateRange.count =
      ref.current.instanceColor.updateRange.count =
        Math.min(limit, range !== undefined ? range : limit, refs.length)
  }, [refs, range])

  useFrame(() => {
    for (i = 0; i < refs.length; i++) {
      refs[i].current.updateMatrix()
      refs[i].current.matrixWorldNeedsUpdate = false
      if (!refs[i].current.matrixWorld.equals(m.fromArray(matrices, i * 16))) {
        refs[i].current.matrixWorld.toArray(matrices, i * 16)
        ref.current.instanceMatrix.needsUpdate = true
      }
      if (!refs[i].current.color.equals(c.fromArray(colors, i * 3))) {
        refs[i].current.color.toArray(colors, i * 3)
        ref.current.instanceColor.needsUpdate = true
      }
    }
  })

  const events = React.useMemo(() => {
    const events = {}
    for (i = 0; i < refs.length; i++) Object.assign(events, (refs[i].current as any)?.__r3f.handlers)
    return Object.keys(events).reduce(
      (prev, key) => ({
        ...prev,
        [key]: (e) => (refs[e.instanceId].current as any)?.__r3f?.handlers?.[key](e),
      }),
      {}
    )
  }, [refs])

  const api = React.useMemo(
    () => ({
      subscribe: (ref) => {
        setRefs((refs) => [...refs, ref])
        return () => setRefs((refs) => refs.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  return (
    <instancedMesh ref={ref} args={[null as any, null as any, 0]} {...events} {...props}>
      <instancedBufferAttribute attach="instanceMatrix" count={matrices.length / 16} array={matrices} itemSize={16} />
      <instancedBufferAttribute attach="instanceColor" count={colors.length / 3} array={colors} itemSize={3} />
      <context.Provider value={api}>{children}</context.Provider>
    </instancedMesh>
  )
}

const Instance = React.forwardRef(({ children, ...props }, ref) => {
  React.useMemo(() => extend({ Position }), [])
  const group = React.useRef()
  const { subscribe } = React.useContext(context)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <position matrixAutoUpdate={false} ref={mergeRefs([ref, group])} {...props}>
      {children}
    </position>
  )
})

export { Instances, Instance }
