import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Line } from '../Line'
import { context } from '.'

const vec1 = new THREE.Vector3()
const vec2 = new THREE.Vector3()

export const calculateOffset = (
  clickPoint: THREE.Vector3,
  normal: THREE.Vector3,
  rayStart: THREE.Vector3,
  rayDir: THREE.Vector3
) => {
  const e1 = normal.dot(normal)
  const e2 = normal.dot(clickPoint) - normal.dot(rayStart)
  const e3 = normal.dot(rayDir)

  vec1
    .copy(rayDir)
    .multiplyScalar(e1 / e3)
    .sub(normal)
  vec2
    .copy(rayDir)
    .multiplyScalar(e2 / e3)
    .add(rayStart)
    .sub(clickPoint)

  const offset = -vec1.dot(vec2) / vec1.dot(vec1)
  return offset
}

const upV = new THREE.Vector3(0, 1, 0)
const offsetMatrix = new THREE.Matrix4()

export const AxisArrow: React.FC<{ direction: THREE.Vector3; axis: 0 | 1 | 2 }> = ({ direction, axis }) => {
  const {
    depthTest,
    axisLength,
    axisWidth,
    pixelValues,
    axisColors,
    hoveredColor,
    opacity,
    onDragStart,
    onDrag,
    onDragEnd,
    userData,
  } = React.useContext(context)

  const camControls = useThree((state) => state.controls as any)
  const size = useThree((state) => state.size)
  const objRef = React.useRef<THREE.Group>(null!)
  const clickInfo = React.useRef<{ clickPoint: THREE.Vector3; dir: THREE.Vector3 } | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerDown = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      const rotation = new THREE.Matrix4().extractRotation(objRef.current.matrixWorld)
      const clickPoint = e.point.clone()
      const dir = direction.clone().applyMatrix4(rotation).normalize()
      clickInfo.current = { clickPoint, dir }
      onDragStart()
      camControls && (camControls.enabled = false)
      e.target.setPointerCapture(e.pointerId)
    },
    [direction, camControls, onDragStart]
  )

  const onPointerMove = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      if (!isHovered) setIsHovered(true)

      if (clickInfo.current) {
        const { clickPoint, dir } = clickInfo.current
        const offset = calculateOffset(clickPoint, dir, e.ray.origin, e.ray.direction)
        offsetMatrix.makeTranslation(dir.x * offset, dir.y * offset, dir.z * offset)
        onDrag(offsetMatrix)
      }
    },
    [onDrag, isHovered]
  )

  const onPointerUp = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      clickInfo.current = null
      onDragEnd()
      camControls && (camControls.enabled = true)
      e.target.releasePointerCapture(e.pointerId)
    },
    [camControls, onDragEnd]
  )

  const onPointerOut = React.useCallback((e: any) => {
    e.stopPropagation()
    setIsHovered(false)
  }, [])

  const { cylinderLength, coneWidth, coneLength, matrixL } = React.useMemo(() => {
    const coneWidth_ = pixelValues ? axisWidth / axisLength : axisLength / 20
    const coneLength_ = pixelValues ? 0.2 : axisLength / 5
    const cylinderLength_ = pixelValues ? 1 - coneLength_ : axisLength - coneLength_
    const quaternion = new THREE.Quaternion().setFromUnitVectors(upV, direction.clone().normalize())
    const matrixL_ = new THREE.Matrix4().makeRotationFromQuaternion(quaternion)

    return {
      cylinderLength: cylinderLength_,
      coneWidth: coneWidth_,
      coneLength: coneLength_,
      matrixL: matrixL_,
    }
  }, [direction, axisLength, axisWidth, pixelValues])

  const resolution = React.useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height])

  const color_ = isHovered ? hoveredColor : axisColors[axis]

  return (
    <group ref={objRef}>
      <group
        matrix={matrixL}
        matrixAutoUpdate={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOut={onPointerOut}
      >
        <Line
          transparent
          depthTest={depthTest}
          points={[0, 0, 0, 0, cylinderLength, 0] as any}
          lineWidth={axisWidth}
          color={color_ as any}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={-10}
          resolution={resolution}
          userData={userData}
        />
        <mesh position={[0, cylinderLength + coneLength / 2.0, 0]} renderOrder={500} userData={userData}>
          <coneGeometry args={[coneWidth, coneLength, 24, 1]} />
          <meshBasicMaterial
            transparent
            depthTest={depthTest}
            color={color_}
            opacity={opacity}
            polygonOffset
            polygonOffsetFactor={-10}
          />
        </mesh>
      </group>
    </group>
  )
}
