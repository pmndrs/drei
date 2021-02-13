import * as React from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise'

const defaultConfig = {
  decay: false,
  decayRate: 0.65,
  maxYaw: 0.1,
  maxPitch: 0.1,
  maxRoll: 0.1,
  yawFrequency: 1,
  pitchFrequency: 1,
  rollFrequency: 1,
}

type ShakeConfig = typeof defaultConfig
type ShakeConfigPartial = Partial<ShakeConfig>

export interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}

export interface CameraShakeProps {
  config?: ShakeConfigPartial
  intensity?: number
  additive?: boolean
  children?: React.ReactElement
}

export const CameraShake = React.forwardRef<ShakeController | undefined, CameraShakeProps>((props, ref) => {
  const { camera } = useThree()
  const config = React.useMemo<ShakeConfig>(() => ({ ...defaultConfig, ...props.config }), [props.config])
  const intensity = React.useRef<number>(props.intensity ? props.intensity : 1)
  const [yawNoise] = React.useState(() => new SimplexNoise())
  const [pitchNoise] = React.useState(() => new SimplexNoise())
  const [rollNoise] = React.useState(() => new SimplexNoise())

  const constrainIntensity = () => {
    if (intensity.current < 0 || intensity.current > 1) {
      intensity.current = intensity.current < 0 ? 0 : 1
    }
  }

  React.useImperativeHandle(
    ref,
    () => ({
      getIntensity: () => {
        return intensity.current
      },
      setIntensity: (val: number) => {
        intensity.current = val
        constrainIntensity()
      },
    }),
    []
  )

  useFrame(({ clock }, delta) => {
    const shake = Math.pow(intensity.current, 2)
    const yaw = config.maxYaw * shake * yawNoise.noise(clock.elapsedTime * config.yawFrequency, 1)
    const pitch = config.maxPitch * shake * pitchNoise.noise(clock.elapsedTime * config.pitchFrequency, 1)
    const roll = config.maxRoll * shake * rollNoise.noise(clock.elapsedTime * config.rollFrequency, 1)

    if (props.additive) {
      camera.rotation.x += pitch
      camera.rotation.y += yaw
      camera.rotation.z += roll
    } else {
      camera.rotation.set(pitch, yaw, roll)
    }

    if (config.decay && intensity.current > 0) {
      intensity.current -= config.decayRate * delta
      constrainIntensity()
    }
  })

  return null
})
