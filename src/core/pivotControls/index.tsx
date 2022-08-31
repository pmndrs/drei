import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { MeshLine, MeshLineMaterial } from 'meshline'

import { AxisArrow } from './AxisArrow'
import { PlaneSlider } from './PlaneSlider'
import { AxisRotator } from './AxisRotator'
import { calculateScaleFactor } from '../../helpers/CameraHelper'

extend({ MeshLine, MeshLineMaterial })

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

type PivotContext = {
  onDragStart: () => void
  onDrag: (mdW: THREE.Matrix4) => void
  onDragEnd: () => void
  axisColors: [string | number, string | number, string | number]
  hoveredColor: string | number
  opacity: number
  axisLength: number
  axisWidth: number
  pixelValues: boolean
  depthTest: boolean
  userData?: any
}

export const context = React.createContext<PivotContext>({
  onDragStart: () => void {},
  onDrag: (mdW: THREE.Matrix4) => void {},
  onDragEnd: () => void {},
  axisColors: ['#ff2060', '#20df80', '#2080ff'],
  hoveredColor: '#ffff40',
  opacity: 1,
  axisLength: 1,
  axisWidth: 5,
  pixelValues: false,
  depthTest: false,
})

type PivotControlsProps = {
  matrix?: THREE.Matrix4
  onDragStart?: () => void
  onDrag?: (l: THREE.Matrix4, deltaL: THREE.Matrix4, w: THREE.Matrix4, deltaW: THREE.Matrix4) => void
  onDragEnd?: () => void
  autoTransform?: boolean
  anchor?: [number, number, number]
  activeAxes?: [boolean, boolean, boolean]
  offset?: [number, number, number]
  rotation?: [number, number, number]
  axisLength?: number
  axisWidth?: number
  pixelValues?: boolean
  depthTest?: boolean
  axisColors?: [string | number, string | number, string | number]
  hoveredColor?: string | number
  opacity?: number
  visible?: boolean
  userData?: any
  children?: any
}

export const PivotControls: React.FC<PivotControlsProps> = ({
  matrix,
  onDragStart,
  onDrag,
  onDragEnd,
  autoTransform = true,
  anchor,
  activeAxes = [true, true, true],
  offset = [0, 0, 0],
  rotation = [0, 0, 0],
  axisLength = 1,
  axisWidth = 5,
  pixelValues = false,
  depthTest = true,
  axisColors = ['#ff2060', '#20df80', '#2080ff'],
  hoveredColor = '#ffff40',
  opacity = 1,
  visible = true,
  userData,
  children,
}) => {
  const parentRef = React.useRef<THREE.Group>(null!)
  const ref = React.useRef<THREE.Group>(null!)
  const gizmoRef = React.useRef<THREE.Group>(null!)
  const childrenRef = React.useRef<THREE.Group>(null!)

  const onDragStart_ = React.useCallback(() => {
    mL0.copy(ref.current.matrix)
    mW0.copy(ref.current.matrixWorld)
    onDragStart && onDragStart()
  }, [onDragStart])

  const onDrag_ = React.useCallback(
    (mdW: THREE.Matrix4) => {
      mP.copy(parentRef.current.matrixWorld)
      mPInv.copy(mP).invert()
      // After applying the delta
      mW.copy(mW0).premultiply(mdW)
      mL.copy(mW).premultiply(mPInv)
      mL0Inv.copy(mL0).invert()
      mdL.copy(mL).multiply(mL0Inv)
      if (autoTransform) ref.current.matrix.copy(mL)
      onDrag && onDrag(mL, mdL, mW, mdW)
    },
    [onDrag, autoTransform]
  )

  const onDragEnd_ = React.useCallback(() => onDragEnd && onDragEnd(), [onDragEnd])

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
  })

  const config = React.useMemo(
    () => ({
      onDragStart: onDragStart_,
      onDrag: onDrag_,
      onDragEnd: onDragEnd_,
      axisColors,
      hoveredColor,
      opacity,
      axisLength,
      axisWidth,
      pixelValues,
      depthTest,
      userData,
    }),
    [
      onDragStart_,
      onDrag_,
      onDragEnd_,
      depthTest,
      axisLength,
      axisWidth,
      pixelValues,
      ...axisColors,
      hoveredColor,
      opacity,
      userData,
    ]
  )

  const vec = new THREE.Vector3()
  useFrame((state) => {
    if (pixelValues) {
      const sf = calculateScaleFactor(gizmoRef.current.getWorldPosition(vec), axisLength, state.camera, state.size)
      if (gizmoRef.current) {
        const newScale = [sf, sf, sf] as [number, number, number]
        if (newScale.some((s, i) => s !== gizmoRef.current?.scale.getComponent(i))) {
          gizmoRef.current.scale.set(...newScale)
          state.invalidate()
        }
      }
    }
  })

  return (
    <context.Provider value={config}>
      <group ref={parentRef}>
        <group ref={ref} matrix={matrix} matrixAutoUpdate={false}>
          <group visible={visible} ref={gizmoRef} position={offset} rotation={rotation}>
            {activeAxes[0] && <AxisArrow axis={0} direction={xDir} />}
            {activeAxes[1] && <AxisArrow axis={1} direction={yDir} />}
            {activeAxes[2] && <AxisArrow axis={2} direction={zDir} />}
            {activeAxes[0] && activeAxes[1] && <PlaneSlider axis={2} dir1={xDir} dir2={yDir} />}
            {activeAxes[0] && activeAxes[2] && <PlaneSlider axis={1} dir1={zDir} dir2={xDir} />}
            {activeAxes[2] && activeAxes[1] && <PlaneSlider axis={0} dir1={yDir} dir2={zDir} />}
            {activeAxes[0] && activeAxes[1] && <AxisRotator axis={2} dir1={xDir} dir2={yDir} />}
            {activeAxes[0] && activeAxes[2] && <AxisRotator axis={1} dir1={zDir} dir2={xDir} />}
            {activeAxes[2] && activeAxes[1] && <AxisRotator axis={0} dir1={yDir} dir2={zDir} />}
          </group>
          <group ref={childrenRef}>{children}</group>
        </group>
      </group>
    </context.Provider>
  )
}
