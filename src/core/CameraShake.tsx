import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Euler } from 'three'
import { SimplexNoise } from 'three-stdlib'

export interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}

type ControlsProto = {
  update(): void
  target: THREE.Vector3
  addEventListener: (event: string, callback: (event: any) => void) => void
  removeEventListener: (event: string, callback: (event: any) => void) => void
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
  // TODO: in a new major this should be the only means of consuming controls, the
  // controls prop can then be removed!
  controls?: React.MutableRefObject<ControlsProto | null>
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
      controls,
    },
    ref
  ) => {
    const camera = useThree((state) => state.camera)
    // @ts-expect-error new in @react-three/fiber@7.0.5
    const defaultControls = useThree((state) => state.controls) as ControlsProto
    const intensityRef = React.useRef<number>(intensity)
    const initialRotation = React.useRef<Euler>(camera.rotation.clone())

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

    React.useEffect(() => {
      const currControls = defaultControls || controls?.current
      const callback = () => void (initialRotation.current = camera.rotation.clone())

      currControls?.addEventListener('change', callback)
      return () => void currControls?.removeEventListener('change', callback)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controls, defaultControls])

    useFrame(({ clock }, delta) => {
      const shake = Math.pow(intensityRef.current, 2)
      const yaw = maxYaw * shake * yawNoise.noise(clock.elapsedTime * yawFrequency, 1)
      const pitch = maxPitch * shake * pitchNoise.noise(clock.elapsedTime * pitchFrequency, 1)
      const roll = maxRoll * shake * rollNoise.noise(clock.elapsedTime * rollFrequency, 1)

      camera.rotation.set(
        initialRotation.current.x + pitch,
        initialRotation.current.y + yaw,
        initialRotation.current.z + roll
      )

      if (decay && intensityRef.current > 0) {
        intensityRef.current -= decayRate * delta
        constrainIntensity()
      }
    })

    return null
  }
)
