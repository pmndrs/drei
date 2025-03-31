import * as React from 'react'
import * as THREE from 'three'
import { ThreeEvent, useThree } from '@react-three/fiber'
import { Line } from '../../core/Line'
import { Html } from '../../web/Html'
import { context } from './context'

const decomposeIntoBasis = (e1: THREE.Vector3, e2: THREE.Vector3, offset: THREE.Vector3) => {
  const i1 =
    Math.abs(e1.x) >= Math.abs(e1.y) && Math.abs(e1.x) >= Math.abs(e1.z)
      ? 0
      : Math.abs(e1.y) >= Math.abs(e1.x) && Math.abs(e1.y) >= Math.abs(e1.z)
        ? 1
        : 2
  const e2DegrowthOrder = [0, 1, 2].sort((a, b) => Math.abs(e2.getComponent(b)) - Math.abs(e2.getComponent(a)))
  const i2 = i1 === e2DegrowthOrder[0] ? e2DegrowthOrder[1] : e2DegrowthOrder[0]
  const a1 = e1.getComponent(i1)
  const a2 = e1.getComponent(i2)
  const b1 = e2.getComponent(i1)
  const b2 = e2.getComponent(i2)
  const c1 = offset.getComponent(i1)
  const c2 = offset.getComponent(i2)

  const y = (c2 - c1 * (a2 / a1)) / (b2 - b1 * (a2 / a1))
  const x = (c1 - y * b1) / a1

  return [x, y]
}

const ray = /* @__PURE__ */ new THREE.Ray()
const intersection = /* @__PURE__ */ new THREE.Vector3()
const offsetMatrix = /* @__PURE__ */ new THREE.Matrix4()

export const PlaneSlider: React.FC<{ dir1: THREE.Vector3; dir2: THREE.Vector3; axis: 0 | 1 | 2 }> = ({
  dir1,
  dir2,
  axis,
}) => {
  const {
    translation,
    translationLimits,
    annotations,
    annotationsClass,
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

  const camControls = useThree((state) => state.controls) as unknown as { enabled: boolean } | undefined
  const divRef = React.useRef<HTMLDivElement>(null!)
  const objRef = React.useRef<THREE.Group>(null!)
  const clickInfo = React.useRef<{
    clickPoint: THREE.Vector3
    e1: THREE.Vector3
    e2: THREE.Vector3
    plane: THREE.Plane
  } | null>(null)
  const offsetX0 = React.useRef<number>(0)
  const offsetY0 = React.useRef<number>(0)
  const [isHovered, setIsHovered] = React.useState(false)

  const onPointerDown = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.innerText = `${translation.current[(axis + 1) % 3].toFixed(2)}, ${translation.current[
          (axis + 2) % 3
        ].toFixed(2)}`
        divRef.current.style.display = 'block'
      }
      e.stopPropagation()
      const clickPoint = e.point.clone()
      const origin = new THREE.Vector3().setFromMatrixPosition(objRef.current.matrixWorld)
      const e1 = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 0).normalize()
      const e2 = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 1).normalize()
      const normal = new THREE.Vector3().setFromMatrixColumn(objRef.current.matrixWorld, 2).normalize()
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin)
      clickInfo.current = { clickPoint, e1, e2, plane }
      offsetX0.current = translation.current[(axis + 1) % 3]
      offsetY0.current = translation.current[(axis + 2) % 3]
      onDragStart({ component: 'Slider', axis, origin, directions: [e1, e2, normal] })
      camControls && (camControls.enabled = false)
      // @ts-ignore
      e.target.setPointerCapture(e.pointerId)
    },
    [annotations, camControls, onDragStart, axis]
  )

  const onPointerMove = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (!isHovered) setIsHovered(true)

      if (clickInfo.current) {
        const { clickPoint, e1, e2, plane } = clickInfo.current
        const [minX, maxX] = translationLimits?.[(axis + 1) % 3] || [undefined, undefined]
        const [minY, maxY] = translationLimits?.[(axis + 2) % 3] || [undefined, undefined]

        ray.copy(e.ray)
        ray.intersectPlane(plane, intersection)
        ray.direction.negate()
        ray.intersectPlane(plane, intersection)
        intersection.sub(clickPoint)
        let [offsetX, offsetY] = decomposeIntoBasis(e1, e2, intersection)
        /* let offsetY = (intersection.y - (intersection.x * e1.y) / e1.x) / (e2.y - (e2.x * e1.y) / e1.x)
        let offsetX = (intersection.x - offsetY * e2.x) / e1.x */
        if (minX !== undefined) {
          offsetX = Math.max(offsetX, minX - offsetX0.current)
        }
        if (maxX !== undefined) {
          offsetX = Math.min(offsetX, maxX - offsetX0.current)
        }
        if (minY !== undefined) {
          offsetY = Math.max(offsetY, minY - offsetY0.current)
        }
        if (maxY !== undefined) {
          offsetY = Math.min(offsetY, maxY - offsetY0.current)
        }
        translation.current[(axis + 1) % 3] = offsetX0.current + offsetX
        translation.current[(axis + 2) % 3] = offsetY0.current + offsetY
        if (annotations) {
          divRef.current.innerText = `${translation.current[(axis + 1) % 3].toFixed(2)}, ${translation.current[
            (axis + 2) % 3
          ].toFixed(2)}`
        }
        offsetMatrix.makeTranslation(
          offsetX * e1.x + offsetY * e2.x,
          offsetX * e1.y + offsetY * e2.y,
          offsetX * e1.z + offsetY * e2.z
        )
        onDrag(offsetMatrix)
      }
    },
    [annotations, onDrag, isHovered, translation, translationLimits, axis]
  )

  const onPointerUp = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (annotations) {
        divRef.current.style.display = 'none'
      }
      e.stopPropagation()
      clickInfo.current = null
      onDragEnd()
      camControls && (camControls.enabled = true)
      // @ts-ignore
      e.target.releasePointerCapture(e.pointerId)
    },
    [annotations, camControls, onDragEnd]
  )

  const onPointerOut = React.useCallback((e: ThreeEvent<PointerEvent>) => {
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
      {annotations && (
        <Html position={[0, 0, 0]}>
          <div
            style={{
              display: 'none',
              background: '#151520',
              color: 'white',
              padding: '6px 8px',
              borderRadius: 7,
              whiteSpace: 'nowrap',
            }}
            className={annotationsClass}
            ref={divRef}
          />
        </Html>
      )}
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
            fog={false}
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
          fog={false}
        />
      </group>
    </group>
  )
}
