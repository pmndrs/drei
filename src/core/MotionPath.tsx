import { useEffect, useRef } from 'react'
import { Box, Sphere, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import * as React from "react"

interface Curve extends THREE.Curve<THREE.Vector3> {}

interface MotionPathProps {
  curves: Curve[];
  focusObject: React.MutableRefObject<THREE.Object3D | undefined>;
  animationSpeed: number;
  showPath: boolean;
  attachCamera: boolean;
}

export const MotionPath: React.FC<MotionPathProps> = (props) => {
  const { curves, focusObject, animationSpeed, showPath, attachCamera } = props

  const path = new THREE.CurvePath<THREE.Vector3>()
  for (var i = 0; i < curves.length; i++) {
    path.add(curves[i])
  }

  const points = path.getPoints(32)

  const currentPos = useRef(path.getPointAt(0))
  const currentT = useRef(0)
  const rate = useRef(0.0015)

  const objRef = useRef<THREE.PerspectiveCamera>(null)

  useEffect(() => {
    console.log('focus: ', focusObject)
  }, [focusObject])

  useFrame(() => {
    currentT.current += rate.current

    if (currentT.current >= 1.0) {
      currentT.current = 0.0
    }

    const pos = path.getPointAt(currentT.current)
    const tangent = path.getTangentAt(currentT.current).normalize()

    if (objRef.current) {
      objRef.current.position.copy(pos)
      objRef.current.position.set(pos.x, pos.y, pos.z)

      const nextPos = path.getPointAt(Math.min(currentT.current + rate.current, 1))

      if (focusObject.current) {
        objRef.current.lookAt(focusObject.current.position)
      } else {
        objRef.current.lookAt(objRef.current.position.clone().add(tangent))
        objRef.current.lookAt(nextPos)
      }
    }

    currentPos.current = pos
  })

  return (
    <group>
      {points.map((item, index) => (
        <Sphere args={[0.05, 16, 16]} key={index} position={[item.x, item.y, item.z]}>
          <meshToonMaterial color={'red'} />
        </Sphere>
      ))}
      <Box args={[1, 1, 1]} position={[5, -5, -5]}>
        <meshToonMaterial color={'limegreen'} />
      </Box>
      <PerspectiveCamera makeDefault position={[0, -2, -2]} ref={objRef} />
    </group>
  )
}
