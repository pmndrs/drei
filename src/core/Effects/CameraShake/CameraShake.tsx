import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, Euler } from '#three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}

type ControlsProto = {
  update(): void
  target: Vector3
  addEventListener: (event: string, callback: (event: any) => void) => void
  removeEventListener: (event: string, callback: (event: any) => void) => void
}

export interface CameraShakeProps {
  /** Initial intensity of the shake (0-1). @default 1 */
  intensity?: number
  /** Whether intensity should decay over time. @default false */
  decay?: boolean
  /** Rate at which intensity decays (when decay=true). @default 0.65 */
  decayRate?: number
  /** Max camera yaw rotation in radians. @default 0.1 */
  maxYaw?: number
  /** Max camera pitch rotation in radians. @default 0.1 */
  maxPitch?: number
  /** Max camera roll rotation in radians. @default 0.1 */
  maxRoll?: number
  /** Frequency of yaw oscillation. @default 0.1 */
  yawFrequency?: number
  /** Frequency of pitch oscillation. @default 0.1 */
  pitchFrequency?: number
  /** Frequency of roll oscillation. @default 0.1 */
  rollFrequency?: number
}

/**
 * Applies a configurable camera shake effect using simplex noise.
 * Works with orbit controls when they have `makeDefault` set.
 * Pass a ref to control intensity programmatically.
 *
 * @example Basic shake
 * ```jsx
 * <CameraShake maxYaw={0.1} maxPitch={0.1} maxRoll={0.1} />
 * ```
 *
 * @example Decaying shake (for impacts)
 * ```jsx
 * const shakeRef = useRef()
 * // Trigger shake on event:
 * shakeRef.current?.setIntensity(1)
 *
 * <CameraShake ref={shakeRef} decay decayRate={0.65} intensity={0} />
 * ```
 */
export const CameraShake: ForwardRefComponent<CameraShakeProps, ShakeController | undefined> =
  /* @__PURE__ */ React.forwardRef<ShakeController | undefined, CameraShakeProps>(
    (
      {
        intensity = 1,
        decay,
        decayRate = 0.65,
        maxYaw = 0.1,
        maxPitch = 0.1,
        maxRoll = 0.1,
        yawFrequency = 0.1,
        pitchFrequency = 0.1,
        rollFrequency = 0.1,
      },
      ref
    ) => {
      const camera = useThree((state) => state.camera)
      const defaultControls = useThree((state) => state.controls) as unknown as ControlsProto
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
        if (defaultControls) {
          const callback = () => void (initialRotation.current = camera.rotation.clone())
          defaultControls.addEventListener('change', callback)
          callback()
          return () => void defaultControls.removeEventListener('change', callback)
        }
      }, [camera, defaultControls])

      useFrame(
        (state, delta) => {
          const shake = Math.pow(intensityRef.current, 2)
          const yaw = maxYaw * shake * yawNoise.noise(state.elapsed * yawFrequency, 1)
          const pitch = maxPitch * shake * pitchNoise.noise(state.elapsed * pitchFrequency, 1)
          const roll = maxRoll * shake * rollNoise.noise(state.elapsed * rollFrequency, 1)

          camera.rotation.set(
            initialRotation.current.x + pitch,
            initialRotation.current.y + yaw,
            initialRotation.current.z + roll
          )

          if (decay && intensityRef.current > 0) {
            intensityRef.current -= decayRate * delta
            constrainIntensity()
          }
        },
        { before: 'render' }
      )

      return null
    }
  )
