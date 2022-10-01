import * as THREE from 'three'
import * as React from 'react'
import { ReactThreeFiber, extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      positionPoint: ReactThreeFiber.Object3DNode<PositionPoint, typeof PositionPoint>
    }
  }
}

type Api = {
  getParent: () => React.MutableRefObject<THREE.Points>
  subscribe: (ref) => void
}

type PointsInstancesProps = JSX.IntrinsicElements['points'] & {
  range?: number
  limit?: number
}

const _inverseMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _ray = /*@__PURE__*/ new THREE.Ray()
const _sphere = /*@__PURE__*/ new THREE.Sphere()
const _position = /*@__PURE__*/ new THREE.Vector3()

export class PositionPoint extends THREE.Group {
  size: number
  color: THREE.Color
  instance: React.MutableRefObject<THREE.Points | undefined>
  instanceKey: React.MutableRefObject<JSX.IntrinsicElements['positionPoint'] | undefined>
  constructor() {
    super()
    this.size = 0
    this.color = new THREE.Color('white')
    this.instance = { current: undefined }
    this.instanceKey = { current: undefined }
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance.current?.geometry
  }

  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    const parent = this.instance.current
    if (!parent || !parent.geometry) return
    const instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.geometry.drawRange.count) return

    const threshold = raycaster.params.Points?.threshold ?? 1
    _sphere.set(this.getWorldPosition(_position), threshold)
    if (raycaster.ray.intersectsSphere(_sphere) === false) return

    _inverseMatrix.copy(parent.matrixWorld).invert()
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)

    const localThreshold = threshold / ((this.scale.x + this.scale.y + this.scale.z) / 3)
    const localThresholdSq = localThreshold * localThreshold
    const rayPointDistanceSq = _ray.distanceSqToPoint(_position)

    if (rayPointDistanceSq < localThresholdSq) {
      const intersectPoint = new THREE.Vector3()
      _ray.closestPointToPoint(_position, intersectPoint)
      intersectPoint.applyMatrix4(this.matrixWorld)
      const distance = raycaster.ray.origin.distanceTo(intersectPoint)
      if (distance < raycaster.near || distance > raycaster.far) return
      intersects.push({
        distance: distance,
        distanceToRay: Math.sqrt(rayPointDistanceSq),
        point: intersectPoint,
        index: instanceId,
        face: null,
        object: this,
      })
    }
  }
}

let i, positionRef
const context = /*@__PURE__*/ React.createContext<Api>(null!)
const parentMatrix = /*@__PURE__*/ new THREE.Matrix4()
const position = /*@__PURE__*/ new THREE.Vector3()

/**
 * Instance implementation, relies on react + context to update the attributes based on the children of this component
 */
const PointsInstances = React.forwardRef<THREE.Points, PointsInstancesProps>(
  ({ children, range, limit = 1000, ...props }, ref) => {
    const parentRef = React.useRef<THREE.Points>(null!)
    const [refs, setRefs] = React.useState<React.MutableRefObject<PositionPoint>[]>([])
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

    const api: Api = React.useMemo(
      () => ({
        getParent: () => parentRef,
        subscribe: (ref) => {
          setRefs((refs) => [...refs, ref])
          return () => setRefs((refs) => refs.filter((item) => item.current !== ref.current))
        },
      }),
      []
    )

    return (
      <points
        userData={{ instances: refs }}
        matrixAutoUpdate={false}
        ref={mergeRefs([ref, parentRef])}
        raycast={() => null}
        {...props}
      >
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

export const Point = React.forwardRef(({ children, ...props }: JSX.IntrinsicElements['positionPoint'], ref) => {
  React.useMemo(() => extend({ PositionPoint }), [])
  const group = React.useRef()
  const { subscribe, getParent } = React.useContext(context)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <positionPoint instance={getParent()} instanceKey={group} ref={mergeRefs([ref, group])} {...props}>
      {children}
    </positionPoint>
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
