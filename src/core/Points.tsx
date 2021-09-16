import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { Position } from '../helpers/Position'

type Api = {
  subscribe: (ref) => void
}

type PointsProps = JSX.IntrinsicElements['points'] & {
  range?: number
  limit?: number
}

const context = React.createContext<Api>(null!)
const m = new THREE.Matrix4()
const v = new THREE.Vector3()
const c = new THREE.Color()
let i

function Points({ children, range, limit = 1000, ...props }: PointsProps) {
  const ref = React.useRef<THREE.Points>(null!)
  const [refs, setRefs] = React.useState<React.MutableRefObject<Position>[]>([])
  const [[positions, colors]] = React.useState(() => {
    const positions = [...new Array(limit * 3)].map(() => 0)
    const colors = [...new Array(limit * 3)].map(() => 1)
    return [new Float32Array(positions), new Float32Array(colors)]
  })

  React.useLayoutEffect(
    () =>
      void (ref.current.geometry.drawRange.count = Math.min(limit, range !== undefined ? range : limit, refs.length)),
    [refs, range]
  )

  useFrame(() => {
    m.copy(ref.current.matrixWorld).invert()
    for (i = 0; i < refs.length; i++) {
      refs[i].current.getWorldPosition(v).applyMatrix4(m)
      if (v.x !== positions[i * 3] || v.y !== positions[i * 3 + 1] || v.z !== positions[i * 3 + 2]) {
        v.toArray(positions, i * 3)
        ref.current.geometry.attributes.position.needsUpdate = true
      }
      if (!refs[i].current.color.equals(c.fromArray(colors, i * 3))) {
        refs[i].current.color.toArray(colors, i * 3)
        ref.current.geometry.attributes.color.needsUpdate = true
      }
    }
  })

  const events = React.useMemo(() => {
    const events = {}
    for (i = 0; i < refs.length; i++) Object.assign(events, (refs[i].current as any)?.__r3f.handlers)
    return Object.keys(events).reduce(
      (prev, key) => ({ ...prev, [key]: (e) => (refs[e.index].current as any)?.__r3f?.handlers?.[key](e) }),
      {}
    )
  }, [refs])

  const api: Api = React.useMemo(
    () => ({
      subscribe: (ref) => {
        setRefs((refs) => [...refs, ref])
        return () => setRefs((refs) => refs.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  return (
    <points ref={ref} {...events} {...props}>
      <bufferGeometry>
        <bufferAttribute
          attachObject={['attributes', 'position']}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute attachObject={['attributes', 'color']} count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <context.Provider value={api}>{children}</context.Provider>
    </points>
  )
}

const Point = React.forwardRef(({ children, ...props }, ref) => {
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

export { Points, Point }
