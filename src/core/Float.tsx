import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import * as THREE from 'three'

export type FloatProps = JSX.IntrinsicElements['group'] & {
  speed?: number
  rotationIntensity?: number
  floatIntensity?: number
  children?: React.ReactNode
  floatingRange?: [number?, number?]
}

export const Float = React.forwardRef<THREE.Group, FloatProps>(
  (
    { children, speed = 1, rotationIntensity = 1, floatIntensity = 1, floatingRange = [-0.1, 0.1], ...props },
    forwardRef
  ) => {
    const ref = React.useRef<THREE.Group>(null!)
    const offset = React.useRef(Math.random() * 10000)
    useFrame((state) => {
      const t = offset.current + state.clock.getElapsedTime()
      ref.current.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity
      ref.current.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity
      ref.current.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity
      let yPosition = Math.sin((t / 4) * speed) / 10
      yPosition = THREE.MathUtils.mapLinear(yPosition, -0.1, 0.1, floatingRange?.[0] ?? -0.1, floatingRange?.[1] ?? 0.1)
      ref.current.position.y = yPosition * floatIntensity
    })
    return (
      <group {...props}>
        <group ref={mergeRefs([ref, forwardRef])}>{children}</group>
      </group>
    )
  }
)
