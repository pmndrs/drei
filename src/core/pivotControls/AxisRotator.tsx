import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Line } from '../Line'
import { Html } from '../../web/Html'
import { context } from './context'

const clickDir = new THREE.Vector3()
const intersectionDir = new THREE.Vector3()

const toDegrees = (radians: number) => (radians * 180) / Math.PI
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

const calculateAngle = (
  clickPoint: THREE.Vector3,
  intersectionPoint: THREE.Vector3,
  origin: THREE.Vector3,
  e1: THREE.Vector3,
  e2: THREE.Vector3
) => {
  clickDir.copy(clickPoint).sub(origin)
  intersectionDir.copy(intersectionPoint).sub(origin)
  const dote1e1 = e1.dot(e1)
  const dote2e2 = e2.dot(e2)
  const uClick = clickDir.dot(e1) / dote1e1
  const vClick = clickDir.dot(e2) / dote2e2
  const uIntersection = intersectionDir.dot(e1) / dote1e1
  const vIntersection = intersectionDir.dot(e2) / dote2e2
  const angleClick = Math.atan2(vClick, uClick)
  const angleIntersection = Math.atan2(vIntersection, uIntersection)
  return angleIntersection - angleClick
}

const rotMatrix = new THREE.Matrix4()
const posNew = new THREE.Vector3()
const ray = new THREE.Ray()
const intersection = new THREE.Vector3()

export const AxisRotator: React.FC<{ dir1: THREE.Vector3; dir2: THREE.Vector3; axis: 0 | 1 | 2 }> = ({
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
  const divRef = React.useRef<HTMLDivElement>(null!)
  const objRef = React.useRef<THREE.Group>(null!)
  const clickInfo = React.useRef<{
    clickPoint: THREE.Vector3
    origin: THREE.Vector3
    e1: THREE.Vector3
    e2: THREE.Vector3
    normal: THREE.Vector3
    plane: THREE.Plane
  } | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerDown = React.useCallback(
    (e: any) => {
      divRef.current.innerText = '0º'
      divRef.current.style.display = 'block'
      e.stopPropagation()
      const clickPoint = e.point.clone()
      const origin = new THREE.Vector3().setFromMatrixPosition(objRef.current.matrixWorld)
      const e1 = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 0).normalize()
      const e2 = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 1).normalize()
      const normal = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 2).normalize()
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin)
      clickInfo.current = { clickPoint, origin, e1, e2, normal, plane }
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
        const { clickPoint, origin, e1, e2, normal, plane } = clickInfo.current
        ray.copy(e.ray)
        ray.intersectPlane(plane, intersection)
        ray.direction.negate()
        ray.intersectPlane(plane, intersection)
        let angle = calculateAngle(clickPoint, intersection, origin, e1, e2)
        let degrees = toDegrees(angle)

        if (e.shiftKey) {
          degrees = Math.round(degrees / 10) * 10
          angle = toRadians(degrees)
        }

        divRef.current.innerText = `${degrees.toFixed(0)} º`
        rotMatrix.makeRotationAxis(normal, angle)
        posNew.copy(origin).applyMatrix4(rotMatrix).sub(origin).negate()
        rotMatrix.setPosition(posNew)
        onDrag(rotMatrix)
      }
    },
    [onDrag, isHovered]
  )

  const onPointerUp = React.useCallback(
    (e: any) => {
      divRef.current.style.display = 'none'
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

  const r = fixed ? 0.65 : scale * 0.65

  const arc = React.useMemo(() => {
    const segments = 32
    const points: THREE.Vector3[] = []
    for (let j = 0; j <= segments; j++) {
      const angle = (j * Math.PI) / (2 * segments)
      points.push(new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0))
    }
    return points
  }, [r])

  return (
    <group
      ref={objRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerOut}
      matrix={matrixL}
      matrixAutoUpdate={false}
    >
      <Html position={[r, r, 0]}>
        <div className="label" ref={divRef} />
      </Html>
      <Line
        transparent
        depthTest={depthTest}
        points={arc}
        lineWidth={lineWidth}
        color={(isHovered ? hoveredColor : axisColors[axis]) as any}
        opacity={opacity}
        polygonOffset
        polygonOffsetFactor={-10}
        userData={userData}
      />
    </group>
  )
}
