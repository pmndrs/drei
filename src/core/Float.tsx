import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type FloatProps = JSX.IntrinsicElements['group'] & {
  speed?: number
  rotationIntensity?: number
  floatIntensity?: number
  children?: React.ReactNode
  floatingRange?: [number?, number?]
}

export const Float = React.forwardRef<THREE.Group, FloatProps>(
  ({ children, speed = 1, rotationIntensity = 1, floatIntensity = 1, floatingRange = [-0.1, 0.1], ...props }, ref) => {
    const float = React.useRef<THREE.Group>(null!)
    React.useImperativeHandle(ref, () => float.current)
    const offset = React.useRef(Math.random() * 10000)
    useFrame((state) => {
      const t = offset.current + state.clock.getElapsedTime()
      float.current.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity
      float.current.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity
      float.current.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity
      let yPosition = Math.sin((t / 4) * speed) / 10
      yPosition = THREE.MathUtils.mapLinear(yPosition, -0.1, 0.1, floatingRange?.[0] ?? -0.1, floatingRange?.[1] ?? 0.1)
      float.current.position.y = yPosition * floatIntensity
    })
    return (
      <group {...props}>
        <group ref={float}>{children}</group>
      </group>
    )
  }
)
