import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler } from 'three'
import { SimplexNoise } from 'three-stdlib'

export interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}

export interface CameraShakeProps {
  intensity?: number
  decay?: boolean
  decayRate?: number
  maxYaw?: number
  maxPitch?: number
  maxRoll?: number
  yawFrequency?: number
  pitchFrequency?: number
  rollFrequency?: number
}

export const CameraShake = React.forwardRef<ShakeController | undefined, CameraShakeProps>(
  (
    {
      intensity = 1,
      decay,
      decayRate = 0.65,
      maxYaw = 0.1,
      maxPitch = 0.1,
      maxRoll = 0.1,
      yawFrequency = 1,
      pitchFrequency = 1,
      rollFrequency = 1,
    },
    ref
  ) => {
    const camera = useThree((state) => state.camera)
    const intensityRef = React.useRef<number>(intensity)
    const initialRotation = React.useRef<Euler>(camera.rotation);
    
    const [yawNoise] = React.useState(() => new SimplexNoise())
    const [pitchNoise] = React.useState(() => new SimplexNoise())
    const [rollNoise] = React.useState(() => new SimplexNoise())

    const constrainIntensity = () => {
      if (intensityRef.current < 0 || intensityRef.current > 1) {
        intensityRef.current = intensityRef.current < 0 ? 0 : 1
      }
    }

    React.useImperativeHandle(
      ref,
      () => ({
        getIntensity: (): number => intensityRef.current,
        setIntensity: (val: number): void => {
          intensityRef.current = val
          constrainIntensity()
        },
      }),
      []
    )

    useFrame(({ clock }, delta) => {
      const shake = Math.pow(intensityRef.current, 2)
      const yaw = maxYaw * shake * yawNoise.noise(clock.elapsedTime * yawFrequency, 1)
      const pitch = maxPitch * shake * pitchNoise.noise(clock.elapsedTime * pitchFrequency, 1)
      const roll = maxRoll * shake * rollNoise.noise(clock.elapsedTime * rollFrequency, 1)

      camera.rotation.set(
        initialRotation.current.x + pitch,
        initialRotation.current.y + yaw,
        initialRotation.current.z + roll
      );

      if (decay && intensityRef.current > 0) {
        intensityRef.current -= decayRate * delta
        constrainIntensity()
      }
    })

    return null
  }
)
