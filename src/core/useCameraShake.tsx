import * as React from 'react'
import * as THREE from 'three'
import { useFrame, Camera } from 'react-three-fiber'
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
  getTrauma: () => number
  setTrauma: (val: number) => void
}

export function useCameraShake(
  baseCamera: Camera | undefined,
  shakeConfig?: ShakeConfigPartial,
  initialTrauma: number = 1
): ShakeController {
  const cameraRef = React.useRef<THREE.Camera>(new THREE.PerspectiveCamera())
  const trauma = React.useRef<number>(initialTrauma)
  const config = React.useMemo<ShakeConfig>(() => ({ ...defaultConfig, ...shakeConfig }), [shakeConfig])
  const yawNoise = React.useMemo(() => makeNoise2D(config.yawNoiseSeed), [config.yawNoiseSeed])
  const pitchNoise = React.useMemo(() => makeNoise2D(config.pitchNoiseSeed), [config.pitchNoiseSeed])
  const rollNoise = React.useMemo(() => makeNoise2D(config.rollNoiseSeed), [config.rollNoiseSeed])

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

  useFrame(({ gl, clock, scene }, delta) => {
    if (baseCamera === undefined) return

    if (trauma.current > 0) {
      cameraRef.current.copy(baseCamera)

      const shake = Math.pow(trauma.current, 2)
      const yaw = config.maxYaw * shake * yawNoise(clock.elapsedTime * config.yawFrequency, 1)
      const pitch = config.maxPitch * shake * pitchNoise(clock.elapsedTime * config.pitchFrequency, 1)
      const roll = config.maxRoll * shake * rollNoise(clock.elapsedTime * config.rollFrequency, 1)

      cameraRef.current.rotateX(pitch)
      cameraRef.current.rotateY(yaw)
      cameraRef.current.rotateZ(roll)

      if (config.decay) {
        trauma.current -= config.decayRate * delta
        constrainTrauma()
      }

      gl.render(scene, cameraRef.current)
    } else {
      gl.render(scene, baseCamera)
    }
  }, 1)

  return { getTrauma, setTrauma }
}
