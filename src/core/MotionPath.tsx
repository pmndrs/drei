import { useEffect, useRef } from 'react'
import { Box, Sphere, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import * as React from 'react'

interface Curve extends THREE.Curve<THREE.Vector3> {}

interface MotionPathProps {
  curves: Curve[]
  focusObject: React.MutableRefObject<THREE.Object3D | undefined | string>
  animationSpeed: number
  showPath: boolean
  attachCamera: boolean
  loop: boolean
  autoStart: boolean
}

export const MotionPath: React.FC<MotionPathProps> = (props) => {
  const {
    curves = [],
    focusObject = {},
    animationSpeed = 0.0015,
    showPath = false,
    attachCamera = false,
    loop = true,
    autoStart = true,
  } = props

  const path = new THREE.CurvePath<THREE.Vector3>()
  for (var i = 0; i < curves.length; i++) {
    path.add(curves[i])
  }

  const points = path.getPoints(32)

  const currentPos = useRef(path.getPointAt(0))
  const currentT = useRef(0)
  const rate = useRef(animationSpeed)

  const objRef = useRef<any>(null)

  useFrame(() => {
    if (autoStart) {
      currentT.current += rate.current

      if (currentT.current >= 1.0) {
        if (loop) {
          currentT.current = 0.0
        } else {
          return
        }
      }
    } else {
      currentT.current = 0
    }

    const pos = path.getPointAt(currentT.current)
    const tangent = path.getTangentAt(currentT.current).normalize()

    if (objRef.current) {
      objRef.current.position.copy(pos)
      objRef.current.position.set(pos.x, pos.y, pos.z)

      const nextPos = path.getPointAt(Math.min(currentT.current + rate.current, 1))

      if (focusObject?.current) {
        objRef.current.lookAt(focusObject?.current.position)
      } else {
        objRef.current.lookAt(objRef.current.position.clone().add(tangent))
        objRef.current.lookAt(nextPos)
      }
    }

    currentPos.current = pos
  })

  return (
    <group>
      {showPath &&
        points.map((item, index) => (
          <Sphere args={[0.05, 16, 16]} key={index} position={[item.x, item.y, item.z]}>
            <meshToonMaterial color="red" />
          </Sphere>
        ))}
      {showPath === true && props.children === undefined && (
        <Box args={[1, 1, 1]} position={[5, -5, -5]} ref={objRef}>
          <meshToonMaterial color="limegreen" />
        </Box>
      )}
      {attachCamera && <PerspectiveCamera makeDefault position={[0, -2, -2]} ref={objRef} />}
      {!attachCamera &&
        React.Children.map(props.children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { ref: objRef })
          }
          return child
        })}
    </group>
  )
}
