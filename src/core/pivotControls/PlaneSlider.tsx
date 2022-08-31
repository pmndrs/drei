import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Line } from '../Line'
import { context } from '.'

const ray = new THREE.Ray()
const intersection = new THREE.Vector3()
const offsetMatrix = new THREE.Matrix4()

export const PlaneSlider: React.FC<{ dir1: THREE.Vector3; dir2: THREE.Vector3; axis: 0 | 1 | 2 }> = ({
  dir1,
  dir2,
  axis,
}) => {
  const {
    depthTest,
    scale,
    lineWidth,
    fixed,
    axisColors,
    hoveredColor,
    opacity,
    onDragStart,
    onDrag,
    onDragEnd,
    userData,
  } = React.useContext(context)

  const camControls = useThree((state) => state.controls as any)
  const objRef = React.useRef<THREE.Group>(null!)
  const clickInfo = React.useRef<{ clickPoint: THREE.Vector3; plane: THREE.Plane } | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerDown = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      const clickPoint = e.point.clone()
      const origin = new THREE.Vector3().setFromMatrixPosition(objRef.current.matrixWorld)
      const normal = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 2).normalize()
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin)
      clickInfo.current = { clickPoint, plane }
      onDragStart()
      camControls && (camControls.enabled = false)
      e.target.setPointerCapture(e.pointerId)
    },
    [camControls, onDragStart]
  )

  const onPointerMove = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      if (!isHovered) setIsHovered(true)

      if (clickInfo.current) {
        const { clickPoint, plane } = clickInfo.current
        ray.copy(e.ray)
        ray.intersectPlane(plane, intersection)
        ray.direction.negate()
        ray.intersectPlane(plane, intersection)
        intersection.sub(clickPoint)
        offsetMatrix.makeTranslation(intersection.x, intersection.y, intersection.z)
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

  const matrixL = React.useMemo(() => {
    const dir1N = dir1.clone().normalize()
    const dir2N = dir2.clone().normalize()
    return new THREE.Matrix4().makeBasis(dir1N, dir2N, dir1N.clone().cross(dir2N))
  }, [dir1, dir2])

  const pos1 = fixed ? 1 / 7 : scale / 7
  const length = fixed ? 0.225 : scale * 0.225
  const color = isHovered ? hoveredColor : axisColors[axis]

  const points = React.useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length, 0),
      new THREE.Vector3(length, length, 0),
      new THREE.Vector3(length, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    [length]
  )

  return (
    <group ref={objRef} matrix={matrixL} matrixAutoUpdate={false}>
      <group position={[pos1 * 1.7, pos1 * 1.7, 0]}>
        <mesh
          visible={true}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerOut={onPointerOut}
          scale={length}
          userData={userData}
        >
          <planeGeometry />
          <meshBasicMaterial
            transparent
            depthTest={depthTest}
            color={color}
            polygonOffset
            polygonOffsetFactor={-10}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Line
          position={[-length / 2, -length / 2, 0]}
          transparent
          depthTest={depthTest}
          points={points}
          lineWidth={lineWidth}
          color={color as any}
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={-10}
          userData={userData}
        />
      </group>
    </group>
  )
}
