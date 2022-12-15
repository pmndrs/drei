import * as THREE from 'three'
import * as React from 'react'
import { Size, extend, useFrame, useThree } from '@react-three/fiber'

import { AxisArrow } from './AxisArrow'
import { PlaneSlider } from './PlaneSlider'
import { AxisRotator } from './AxisRotator'
import { context, OnDragStartProps } from './context'

const tV0 = new THREE.Vector3()
const tV1 = new THREE.Vector3()
const tV2 = new THREE.Vector3()

const getPoint2 = (point3: THREE.Vector3, camera: THREE.Camera, size: Size) => {
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  camera.updateMatrixWorld(false)
  const vector = point3.project(camera)
  vector.x = vector.x * widthHalf + widthHalf
  vector.y = -(vector.y * heightHalf) + heightHalf
  return vector
}

const getPoint3 = (point2: THREE.Vector3, camera: THREE.Camera, size: Size, zValue: number = 1) => {
  const vector = tV0.set((point2.x / size.width) * 2 - 1, -(point2.y / size.height) * 2 + 1, zValue)
  vector.unproject(camera)
  return vector
}

export const calculateScaleFactor = (point3: THREE.Vector3, radiusPx: number, camera: THREE.Camera, size: Size) => {
  const point2 = getPoint2(tV2.copy(point3), camera, size)
  let scale = 0
  for (let i = 0; i < 2; ++i) {
    const point2off = tV1.copy(point2).setComponent(i, point2.getComponent(i) + radiusPx)
    const point3off = getPoint3(point2off, camera, size, point2off.z)
    scale = Math.max(scale, point3.distanceTo(point3off))
  }
  return scale
}

const mL0 = new THREE.Matrix4()
const mW0 = new THREE.Matrix4()
const mP = new THREE.Matrix4()
const mPInv = new THREE.Matrix4()
const mW = new THREE.Matrix4()
const mL = new THREE.Matrix4()
const mL0Inv = new THREE.Matrix4()
const mdL = new THREE.Matrix4()

const bb = new THREE.Box3()
const bbObj = new THREE.Box3()
const vCenter = new THREE.Vector3()
const vSize = new THREE.Vector3()
const vAnchorOffset = new THREE.Vector3()
const vPosition = new THREE.Vector3()

const xDir = new THREE.Vector3(1, 0, 0)
const yDir = new THREE.Vector3(0, 1, 0)
const zDir = new THREE.Vector3(0, 0, 1)

type PivotControlsProps = {
  /** Scale of the gizmo, 1 */
  scale?: number
  /** Width of the gizmo lines, this is a THREE.Line2 prop, 2.5 */
  lineWidth?: number
  /** If fixed is true is remains constant in size, scale is now in pixels, false */
  fixed?: boolean
  /** Pivot does not act as a group, it won't shift contents but can offset in position */
  offset?: [number, number, number]
  /** Starting rotation */
  rotation?: [number, number, number]

  /** Starting matrix */
  matrix?: THREE.Matrix4
  /** BBAnchor, each axis can be between -1/0/+1 */
  anchor?: [number, number, number]
  /** If autoTransform is true, automatically apply the local transform on drag, true */
  autoTransform?: boolean
  /** Allows you to switch individual axes off */
  activeAxes?: [boolean, boolean, boolean]

  disableAxes?: boolean
  disableSliders?: boolean
  disableRotations?: boolean

  /** Limits */
  translationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]
  rotationLimits?: [[number, number] | undefined, [number, number] | undefined, [number, number] | undefined]

  /** RGB colors */
  axisColors?: [string | number, string | number, string | number]
  /** Color of the hovered item */
  hoveredColor?: string | number
  /** CSS Classname applied to the HTML annotations */
  annotationsClass?: string
  /** Drag start event */
  onDragStart?: (props: OnDragStartProps) => void
  /** Drag event */
  onDrag?: (l: THREE.Matrix4, deltaL: THREE.Matrix4, w: THREE.Matrix4, deltaW: THREE.Matrix4) => void
  /** Drag end event */
  onDragEnd?: () => void
  /** Set this to false if you want the gizmo to be visible through faces */
  depthTest?: boolean
  displayValues?: boolean
  opacity?: number
  visible?: boolean
  userData?: { [key: string]: any }
  children?: React.ReactNode
}

export const PivotControls = React.forwardRef<THREE.Group, PivotControlsProps>(
  (
    {
      matrix,
      onDragStart,
      onDrag,
      onDragEnd,
      autoTransform = true,
      anchor,
      disableAxes = false,
      disableSliders = false,
      disableRotations = false,
      activeAxes = [true, true, true],
      offset = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      lineWidth = 4,
      fixed = false,
      translationLimits,
      rotationLimits,
      depthTest = true,
      axisColors = ['#ff2060', '#20df80', '#2080ff'],
      hoveredColor = '#ffff40',
      displayValues = true,
      annotationsClass,
      opacity = 1,
      visible = true,
      userData,
      children,
    },
    fRef
  ) => {
    const invalidate = useThree((state) => state.invalidate)
    const parentRef = React.useRef<THREE.Group>(null!)
    const ref = React.useRef<THREE.Group>(null!)
    const gizmoRef = React.useRef<THREE.Group>(null!)
    const childrenRef = React.useRef<THREE.Group>(null!)
    const translation = React.useRef<[number, number, number]>([0, 0, 0])

    React.useLayoutEffect(() => {
      if (!anchor) return
      childrenRef.current.updateWorldMatrix(true, true)

      mPInv.copy(childrenRef.current.matrixWorld).invert()
      bb.makeEmpty()
      childrenRef.current.traverse((obj: any) => {
        if (!obj.geometry) return
        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox()
        mL.copy(obj.matrixWorld).premultiply(mPInv)
        bbObj.copy(obj.geometry.boundingBox)
        bbObj.applyMatrix4(mL)
        bb.union(bbObj)
      })
      vCenter.copy(bb.max).add(bb.min).multiplyScalar(0.5)
      vSize.copy(bb.max).sub(bb.min).multiplyScalar(0.5)
      vAnchorOffset
        .copy(vSize)
        .multiply(new THREE.Vector3(...anchor))
        .add(vCenter)
      vPosition.set(...offset).add(vAnchorOffset)
      gizmoRef.current.position.copy(vPosition)
      invalidate()
    })

    const config = React.useMemo(
      () => ({
        onDragStart: (props: OnDragStartProps) => {
          mL0.copy(ref.current.matrix)
          mW0.copy(ref.current.matrixWorld)
          onDragStart && onDragStart(props)
          invalidate()
        },
        onDrag: (mdW: THREE.Matrix4) => {
          mP.copy(parentRef.current.matrixWorld)
          mPInv.copy(mP).invert()
          // After applying the delta
          mW.copy(mW0).premultiply(mdW)
          mL.copy(mW).premultiply(mPInv)
          mL0Inv.copy(mL0).invert()
          mdL.copy(mL).multiply(mL0Inv)
          if (autoTransform) ref.current.matrix.copy(mL)
          onDrag && onDrag(mL, mdL, mW, mdW)
          invalidate()
        },
        onDragEnd: () => {
          if (onDragEnd) onDragEnd()
          invalidate()
        },
        translation,
        translationLimits,
        rotationLimits,
        axisColors,
        hoveredColor,
        opacity,
        scale,
        lineWidth,
        fixed,
        displayValues,
        depthTest,
        userData,
        annotationsClass,
      }),
      [
        onDragStart,
        onDrag,
        onDragEnd,
        translation,
        translationLimits,
        rotationLimits,
        depthTest,
        scale,
        lineWidth,
        fixed,
        ...axisColors,
        hoveredColor,
        opacity,
        displayValues,
        userData,
        autoTransform,
        annotationsClass,
      ]
    )

    const vec = new THREE.Vector3()
    useFrame((state) => {
      if (fixed) {
        const sf = calculateScaleFactor(gizmoRef.current.getWorldPosition(vec), scale, state.camera, state.size)
        if (gizmoRef.current) {
          if (
            gizmoRef.current?.scale.x !== sf ||
            gizmoRef.current?.scale.y !== sf ||
            gizmoRef.current?.scale.z !== sf
          ) {
            gizmoRef.current.scale.setScalar(sf)
            state.invalidate()
          }
        }
      }
    })

    React.useImperativeHandle(fRef, () => ref.current, [])

    return (
      <context.Provider value={config}>
        <group ref={parentRef}>
          <group ref={ref} matrix={matrix} matrixAutoUpdate={false}>
            <group visible={visible} ref={gizmoRef} position={offset} rotation={rotation}>
              {!disableAxes && activeAxes[0] && <AxisArrow axis={0} direction={xDir} />}
              {!disableAxes && activeAxes[1] && <AxisArrow axis={1} direction={yDir} />}
              {!disableAxes && activeAxes[2] && <AxisArrow axis={2} direction={zDir} />}
              {!disableSliders && activeAxes[0] && activeAxes[1] && <PlaneSlider axis={2} dir1={xDir} dir2={yDir} />}
              {!disableSliders && activeAxes[0] && activeAxes[2] && <PlaneSlider axis={1} dir1={zDir} dir2={xDir} />}
              {!disableSliders && activeAxes[2] && activeAxes[1] && <PlaneSlider axis={0} dir1={yDir} dir2={zDir} />}
              {!disableRotations && activeAxes[0] && activeAxes[1] && <AxisRotator axis={2} dir1={xDir} dir2={yDir} />}
              {!disableRotations && activeAxes[0] && activeAxes[2] && <AxisRotator axis={1} dir1={zDir} dir2={xDir} />}
              {!disableRotations && activeAxes[2] && activeAxes[1] && <AxisRotator axis={0} dir1={yDir} dir2={zDir} />}
            </group>
            <group ref={childrenRef}>{children}</group>
          </group>
        </group>
      </context.Provider>
    )
  }
)
