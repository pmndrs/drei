import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { Position } from '../helpers/Position'

type Api = {
  subscribe: (ref) => void
}

type PointsInstancesProps = JSX.IntrinsicElements['points'] & {
  range?: number
  limit?: number
}

let i, positionRef
const context = React.createContext<Api>(null!)
const parentMatrix = new THREE.Matrix4()
const position = new THREE.Vector3()
const color = new THREE.Color()

/**
 * Instance implementation, relies on react + context to update the attributes based on the children of this component
 */
const PointsInstances = React.forwardRef<THREE.Points, PointsInstancesProps>(
  ({ children, range, limit = 1000, ...props }, ref) => {
    const parentRef = React.useRef<THREE.Points>(null!)
    const [refs, setRefs] = React.useState<React.MutableRefObject<Position>[]>([])
    const [[positions, colors, sizes]] = React.useState(() => [
      new Float32Array(limit * 3),
      Float32Array.from({ length: limit * 3 }, () => 1),
      Float32Array.from({ length: limit }, () => 1),
    ])

    React.useEffect(() => {
      // We might be a frame too late? 🤷‍♂️
      parentRef.current.geometry.attributes.position.needsUpdate = true
    })

    useFrame(() => {
      parentRef.current.updateMatrix()
      parentRef.current.updateMatrixWorld()
      parentMatrix.copy(parentRef.current.matrixWorld).invert()

      parentRef.current.geometry.drawRange.count = Math.min(limit, range !== undefined ? range : limit, refs.length)

      for (i = 0; i < refs.length; i++) {
        positionRef = refs[i].current
        positionRef.getWorldPosition(position).applyMatrix4(parentMatrix)
        position.toArray(positions, i * 3)
        parentRef.current.geometry.attributes.position.needsUpdate = true
        positionRef.matrixWorldNeedsUpdate = true
        positionRef.color.toArray(colors, i * 3)
        parentRef.current.geometry.attributes.color.needsUpdate = true
        sizes.set([positionRef.size], i)
        parentRef.current.geometry.attributes.size.needsUpdate = true
      }
    })

    const events = React.useMemo(() => {
      const events = {}
      for (i = 0; i < refs.length; i++) Object.assign(events, (refs[i].current as any)?.__r3f.handlers)
      return Object.keys(events).reduce(
        (prev, key) => ({
          ...prev,
          [key]: (event) => {
            const object = refs[event.index]?.current
            return (object as any)?.__r3f?.handlers?.[key]({ ...event, object })
          },
        }),
        {}
      )
    }, [children, refs])

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
      <points matrixAutoUpdate={false} ref={mergeRefs([ref, parentRef])} {...events} {...props}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attach="attributes-size"
            count={sizes.length}
            array={sizes}
            itemSize={1}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <context.Provider value={api}>{children}</context.Provider>
      </points>
    )
  }
)

export const Point = React.forwardRef(({ children, ...props }, ref) => {
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

/**
 * Buffer implementation, relies on complete buffers of the correct number, leaves it to the user to update them
 */
type PointsBuffersProps = JSX.IntrinsicElements['points'] & {
  // a buffer containing all points position
  positions: Float32Array
  colors?: Float32Array
  sizes?: Float32Array
  // The size of the points in the buffer
  stride?: 2 | 3
}

export const PointsBuffer = React.forwardRef<THREE.Points, PointsBuffersProps>(
  ({ children, positions, colors, sizes, stride = 3, ...props }, forwardedRef) => {
    const pointsRef = React.useRef<THREE.Points>(null!)

    useFrame(() => {
      const attr = pointsRef.current.geometry.attributes
      attr.position.needsUpdate = true
      if (colors) attr.color.needsUpdate = true
      if (sizes) attr.size.needsUpdate = true
    })

    return (
      <points ref={mergeRefs([forwardedRef, pointsRef])} {...props}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / stride}
            array={positions}
            itemSize={stride}
            usage={THREE.DynamicDrawUsage}
          />
          {colors && (
            <bufferAttribute
              attach="attributes-color"
              count={colors.length / stride}
              array={colors}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
          )}
          {sizes && (
            <bufferAttribute
              attach="attributes-size"
              count={sizes.length / stride}
              array={sizes}
              itemSize={1}
              usage={THREE.DynamicDrawUsage}
            />
          )}
        </bufferGeometry>
        {children}
      </points>
    )
  }
)

export const Points = React.forwardRef<THREE.Points, PointsBuffersProps | PointsInstancesProps>(
  (props, forwardedRef) => {
    if ((props as PointsBuffersProps).positions instanceof Float32Array) {
      return <PointsBuffer {...(props as PointsBuffersProps)} ref={forwardedRef} />
    } else return <PointsInstances {...(props as PointsInstancesProps)} ref={forwardedRef} />
  }
)
