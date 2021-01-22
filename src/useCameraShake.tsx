import * as React from 'react'
import * as THREE from 'three'
import { Camera, useThree, useFrame } from 'react-three-fiber'
import { makeNoise2D } from 'open-simplex-noise'

export interface ShakeConfig {
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
  decay: true,
  decayRate: 0.75,
  maxYaw: 0.1,
  maxPitch: 0.1,
  maxRoll: 0.1,
  yawFrequency: 10,
  pitchFrequency: 10,
  rollFrequency: 10,
  yawNoiseSeed: 10,
  pitchNoiseSeed: 20,
  rollNoiseSeed: 30,
}

export interface ShakeController {
  setTrauma: (val: number) => void
  getTrauma: () => number
  addTrauma: (val: number) => void
  clearTrauma: () => void
  updateConfig: (cfg: ShakeConfigPartial) => void
}

export function useCameraShake(
  controlledCam: React.MutableRefObject<Camera | undefined>,
  shakeConfig?: ShakeConfigPartial,
  initialTrauma?: number
) {
  const { setDefaultCamera } = useThree()
  const [config, setConfig] = React.useState<ShakeConfig>({ ...defaultConfig, ...shakeConfig })
  const shakyCam = React.useRef<Camera>(new THREE.PerspectiveCamera())
  const trauma = React.useRef<number>(initialTrauma ? initialTrauma : 0) // range [0-1]

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

  const updateConfig = (cfg: ShakeConfigPartial) => {
    setConfig({ ...config, ...cfg })
  }

  useFrame(({ clock }, delta) => {
    if (!controlledCam.current) return // ref checks

    if (trauma.current > 0) {
      shakyCam.current.copy(controlledCam.current as never) // I dont understand why this expects never.

      const shake = Math.pow(trauma.current, 2)
      const yaw = config.maxYaw * shake * yawNoise(clock.elapsedTime * config.yawFrequency, 1)
      const pitch = config.maxPitch * shake * pitchNoise(clock.elapsedTime * config.pitchFrequency, 1)
      const roll = config.maxRoll * shake * rollNoise(clock.elapsedTime * config.rollFrequency, 1)

      shakyCam.current.rotation.x += pitch
      shakyCam.current.rotation.y += yaw
      shakyCam.current.rotation.z += roll

      if (config.decay) {
        trauma.current -= config.decayRate * delta
        constrainTrauma()
      }

      setDefaultCamera(shakyCam.current)
    } else {
      setDefaultCamera(controlledCam.current)
    }
  })

  // Maybe just give direct access to the trauma/config refs instead?
  return { setTrauma, getTrauma, addTrauma, clearTrauma, updateConfig } as ShakeController
}
