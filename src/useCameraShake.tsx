import * as React from 'react'
import * as THREE from 'three'
import { Camera, useThree, useFrame } from 'react-three-fiber'
import { makeNoise2D, Noise2D } from 'open-simplex-noise'

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

export interface ShakeConfigPartial {
  decay?: boolean
  decayRate?: number
  maxYaw?: number
  maxPitch?: number
  maxRoll?: number
  yawFrequency?: number
  pitchFrequency?: number
  rollFrequency?: number
  yawNoiseSeed?: number
  pitchNoiseSeed?: number
  rollNoiseSeed?: number
}

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
  getConfig: () => ShakeConfig
  setTrauma: (val: number) => void
  getTrauma: () => number
  addTrauma: (val: number) => void
  clearTrauma: () => void
  setConfig: (newCfg: ShakeConfigPartial) => void
  toggleDecay: () => void
}

export function useCameraShake(
  controlledCam: React.MutableRefObject<Camera | undefined>,
  shakeConfig?: ShakeConfigPartial
) {
  const { setDefaultCamera } = useThree()
  const shakyCam = React.useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera())
  const config = React.useRef<ShakeConfig>({ ...defaultConfig, ...shakeConfig })
  const trauma = React.useRef<number>(0) // range [0-1]

  const yawNoise = React.useRef<Noise2D>(makeNoise2D(config.current.yawNoiseSeed))
  const pitchNoise = React.useRef<Noise2D>(makeNoise2D(config.current.pitchNoiseSeed))
  const rollNoise = React.useRef<Noise2D>(makeNoise2D(config.current.rollNoiseSeed))

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

  const setConfig = (newConfig: ShakeConfigPartial) => {
    config.current = { ...config.current, ...newConfig }
  }

  const getConfig = () => {
    return config.current
  }

  const toggleDecay = () => {
    setConfig({ decay: !config.current.decay })
  }

  React.useEffect(() => {
    yawNoise.current = makeNoise2D(config.current.yawNoiseSeed)
  }, [config.current.yawNoiseSeed])

  React.useEffect(() => {
    pitchNoise.current = makeNoise2D(config.current.pitchNoiseSeed)
  }, [config.current.pitchNoiseSeed])

  React.useEffect(() => {
    rollNoise.current = makeNoise2D(config.current.rollNoiseSeed)
  }, [config.current.rollNoiseSeed])

  useFrame(({ clock }, delta) => {
    if (controlledCam.current) {
      if (trauma.current > 0) {
        shakyCam.current = shakyCam.current.copy(controlledCam.current as never) // I dont understand why this expects never.

        const cfg = config.current
        const shake = Math.pow(trauma.current, 2)

        const yaw = cfg.maxYaw * shake * yawNoise.current(clock.elapsedTime * cfg.yawFrequency, 1)
        const pitch = cfg.maxPitch * shake * pitchNoise.current(clock.elapsedTime * cfg.pitchFrequency, 1)
        const roll = cfg.maxRoll * shake * rollNoise.current(clock.elapsedTime * cfg.rollFrequency, 1)

        shakyCam.current.rotation.x += pitch
        shakyCam.current.rotation.y += yaw
        shakyCam.current.rotation.z += roll

        setDefaultCamera(shakyCam.current)

        if (cfg.decay) {
          trauma.current -= cfg.decayRate * delta
          constrainTrauma()
        }

        setDefaultCamera(shakyCam.current)
      } else {
        setDefaultCamera(controlledCam.current)
      }
    }
  })

  // Maybe just give direct access to the trauma/config refs instead?
  return { setTrauma, getTrauma, addTrauma, clearTrauma, setConfig, getConfig, toggleDecay } as ShakeController
}
