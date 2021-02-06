import * as React from 'react'
import * as THREE from 'three'
import { useFrame, Camera } from 'react-three-fiber'
import { makeNoise3D } from 'open-simplex-noise'

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
  getTrauma: () => number
  setTrauma: (val: number) => void
}

export function useCameraShake(
  baseCamera: Camera | undefined,
  shakeConfig?: ShakeConfigPartial,
  initialTrauma: number = 1
): ShakeController {
  const trauma = React.useRef<number>(initialTrauma)

  const config = React.useMemo<ShakeConfig>(() => ({ ...defaultConfig, ...shakeConfig }), [shakeConfig])

  const yawNoise = React.useMemo(() => makeNoise3D(config.yawNoiseSeed), [config.yawNoiseSeed])
  const pitchNoise = React.useMemo(() => makeNoise3D(config.pitchNoiseSeed), [config.pitchNoiseSeed])
  const rollNoise = React.useMemo(() => makeNoise3D(config.rollNoiseSeed), [config.rollNoiseSeed])

  React.useEffect(() => {
    if (baseCamera) {
      origin.current = origin.current.copy(baseCamera.rotation)
    }
  }, [baseCamera])

  const constrainTrauma = () => {
    if (trauma.current < 0 || trauma.current > 1) {
      trauma.current = trauma.current < 0 ? 0 : 1
    }
  }

  const getTrauma = () => {
    return trauma.current
  }

  const setTrauma = (val: number) => {
    trauma.current = val
    constrainTrauma()
  }

  useFrame(({ clock }, delta) => {
    if (baseCamera === undefined) return

    if (trauma.current > 0) {
      const shake = Math.pow(trauma.current, 2)
      const pitch = config.maxPitch * shake * pitchNoise(clock.elapsedTime * 0.01, 1, 1)
      const yaw = config.maxYaw * shake * yawNoise(1, clock.elapsedTime * 0.01, 1)
      const roll = config.maxRoll * shake * rollNoise(1, 1, clock.elapsedTime * 0.01)

      if (config.decay) {
        trauma.current -= config.decayRate * delta
        constrainTrauma()
      }

      console.log(pitch, yaw, roll)

      baseCamera.rotation.x += pitch
      baseCamera.rotation.y += yaw
      baseCamera.rotation.z += roll
    }
  })

  return { getTrauma, setTrauma }
}
