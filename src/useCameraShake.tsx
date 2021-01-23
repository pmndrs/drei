import * as React from 'react'
import * as THREE from 'three'
import { Camera, useThree, useFrame } from 'react-three-fiber'
import { makeNoise2D } from 'open-simplex-noise'

interface ShakeConfig {
  decay: boolean
  decayRate: number
  maxYaw: number
  maxPitch: number
  maxRoll: number
  yawFrequency: number
  pitchFrequency: number
  rollFrequency: number
  yawNoiseSeed: number
  pitchNoiseSeed: number
  rollNoiseSeed: number
}
export type ShakeConfigPartial = Partial<ShakeConfig>

const defaultConfig: ShakeConfig = {
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

export function useCameraShake(
  controlledCam: React.MutableRefObject<Camera | undefined>,
  shakeConfig?: ShakeConfigPartial,
  initialTrauma?: number
) {
  const { setDefaultCamera } = useThree()
  const shakyCam = React.useMemo(() => new THREE.PerspectiveCamera(), [])
  const config = React.useMemo<ShakeConfig>(() => {
    return { ...defaultConfig, ...shakeConfig }
  }, [shakeConfig])
  const trauma = React.useRef<number>(initialTrauma === undefined ? 1 : initialTrauma)

  const yawNoise = React.useMemo(() => makeNoise2D(config.yawNoiseSeed), [config.yawNoiseSeed])
  const pitchNoise = React.useMemo(() => makeNoise2D(config.pitchNoiseSeed), [config.pitchNoiseSeed])
  const rollNoise = React.useMemo(() => makeNoise2D(config.rollNoiseSeed), [config.rollNoiseSeed])

  const constrainTrauma = () => {
    if (trauma.current < 0 || trauma.current > 1) {
      trauma.current = trauma.current < 0 ? 0 : 1
    }
  }

  const setTrauma = (val: number) => {
    trauma.current = val
    constrainTrauma()
  }

  const getTrauma = () => {
    return trauma.current
  }

  const addTrauma = (val: number) => {
    trauma.current += val
    constrainTrauma()
  }

  const clearTrauma = () => {
    trauma.current = 0
  }

  useFrame(({ clock }, delta) => {
    if (!controlledCam.current) return // ref checks

    if (trauma.current > 0) {
      shakyCam.copy(controlledCam.current as never) // I dont understand why this expects never.

      const shake = Math.pow(trauma.current, 2)
      const yaw = config.maxYaw * shake * yawNoise(clock.elapsedTime * config.yawFrequency, 1)
      const pitch = config.maxPitch * shake * pitchNoise(clock.elapsedTime * config.pitchFrequency, 1)
      const roll = config.maxRoll * shake * rollNoise(clock.elapsedTime * config.rollFrequency, 1)

      shakyCam.rotation.x += pitch
      shakyCam.rotation.y += yaw
      shakyCam.rotation.z += roll

      if (config.decay) {
        trauma.current -= config.decayRate * delta
        constrainTrauma()
      }

      setDefaultCamera(shakyCam)
    } else {
      setDefaultCamera(controlledCam.current)
    }
  })

  return { setTrauma, getTrauma, addTrauma, clearTrauma } as ShakeController
}
