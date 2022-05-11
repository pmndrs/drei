import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import * as THREE from 'three'

export type FloatProps = JSX.IntrinsicElements['group'] & {
  speed?: number
  rotationIntensity?: number
  floatIntensity?: number
  children?: React.ReactNode
  minPosition?: number
  maxPosition?: number
}

export const Float = React.forwardRef<THREE.Group, FloatProps>(
  (
    {
      children,
      speed = 1,
      rotationIntensity = 1,
      floatIntensity = 1,
      minPosition = -1 * floatIntensity,
      maxPosition = floatIntensity,
      ...props
    },
    forwardRef
  ) => {
    const ref = React.useRef<THREE.Group>(null!)
    const offset = React.useRef(Math.random() * 10000)
    useFrame((state) => {
      const t = offset.current + state.clock.getElapsedTime()
      ref.current.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity
      ref.current.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity
      ref.current.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity
      let yPosition = (Math.sin((t / 4) * speed) / 10) * floatIntensity
      yPosition = THREE.MathUtils.mapLinear(
        yPosition,
        -0.1 * floatIntensity,
        floatIntensity * 0.1,
        minPosition,
        maxPosition
      )
      ref.current.position.y = yPosition
    })
    return (
      <group {...props}>
        <group ref={mergeRefs([ref, forwardRef])}>{children}</group>
      </group>
    )
  }
)
