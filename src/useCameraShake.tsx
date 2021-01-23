import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'
import { makeNoise2D } from 'open-simplex-noise'

type ShakeConfig = typeof defaultConfig
export type ShakeConfigPartial = Partial<ShakeConfig>

const defaultConfig = {
  decay: false,
  decayRate: 0.65,
  maxYaw: 0.1,
  maxPitch: 0.1,
  maxRoll: 0.1,
  yawFrequency: 1,
  pitchFrequency: 1,
  rollFrequency: 1,
  yawNoiseSeed: 10,
  pitchNoiseSeed: 20,
  rollNoiseSeed: 30,
}

export interface ShakeController {
  setTrauma: (val: number) => void
  getTrauma: () => number
  addTrauma: (val: number) => void
  clearTrauma: () => void
}

export type ShakeCamera = THREE.PerspectiveCamera & ShakeController

export function useCameraShake(shakeConfig?: ShakeConfigPartial, initialTrauma: number = 1) {
  const cameraRef = React.useRef<ShakeCamera>()
  const trauma = React.useRef<number>(initialTrauma)
  // merged config for hook
  const config = React.useMemo<ShakeConfig>(() => ({ ...defaultConfig, ...shakeConfig }), [shakeConfig])
  // noies functions
  const yawNoise = React.useMemo(() => makeNoise2D(config.yawNoiseSeed), [config.yawNoiseSeed])
  const pitchNoise = React.useMemo(() => makeNoise2D(config.pitchNoiseSeed), [config.pitchNoiseSeed])
  const rollNoise = React.useMemo(() => makeNoise2D(config.rollNoiseSeed), [config.rollNoiseSeed])

  const constrainTrauma = () => {
    if (trauma.current < 0 || trauma.current > 1) {
      trauma.current = trauma.current < 0 ? 0 : 1
    }
  }

  React.useImperativeHandle(
    cameraRef,
    <T extends ShakeCamera>() => ({
      ...(cameraRef.current as T),
      setTrauma: (val: number) => {
        trauma.current = val
        constrainTrauma()
      },
      getTrauma: () => {
        return trauma.current
      },
      addTrauma: (val: number) => {
        trauma.current += val
        constrainTrauma()
      },
      clearTrauma: () => {
        trauma.current = 0
      },
    }),
    []
  )

  useFrame(({ clock }, delta) => {
    if (!cameraRef.current) return // ref checks

    if (trauma.current > 0) {
      const shake = trauma.current
      const yaw = config.maxYaw * shake * (yawNoise(clock.elapsedTime * config.yawFrequency, 1) * 2 - 1)
      const pitch = config.maxPitch * shake * (pitchNoise(clock.elapsedTime * config.pitchFrequency, 1) * 2 - 1)
      const roll = config.maxRoll * shake * (rollNoise(clock.elapsedTime * config.rollFrequency, 1) * 2 - 1)

      cameraRef.current.rotateX(pitch)
      cameraRef.current.rotateY(yaw)
      cameraRef.current.rotateZ(roll)

      if (config.decay) {
        trauma.current = THREE.MathUtils.lerp(trauma.current, 0, config.decayRate * delta)
      }
    }
  })

  return cameraRef
}
