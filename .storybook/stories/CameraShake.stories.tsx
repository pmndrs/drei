import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { CameraShake, OrbitControls } from '../../src'

export default {
  title: 'Camera/CameraShake',
  component: CameraShake,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)} controls={false}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function Scene() {
  const cube = React.useRef<THREE.Mesh>()

  useFrame(() => {
    if (cube.current) {
      cube.current.rotation.x = cube.current.rotation.y += 0.01
    }
  })

  return (
    <>
      <mesh ref={cube}>
        <boxBufferGeometry args={[2, 2, 2]} />
        <meshStandardMaterial wireframe color="white" />
      </mesh>
      <mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <planeBufferGeometry args={[200, 200, 75, 75]} />
        <meshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function CameraShakeScene() {
  const cfg = useShakeConfig()
  return (
    <>
      <React.Suspense fallback={null}>
        <CameraShake {...cfg} />
        <Scene />
      </React.Suspense>
    </>
  )
}

function CameraShakeWithOrbitScene() {
  const cfg = useShakeConfig()
  return (
    <>
      <React.Suspense fallback={null}>
        <OrbitControls />
        <CameraShake {...cfg} />
        <Scene />
      </React.Suspense>
    </>
  )
}

function useShakeConfig() {
  const numberConfig = { min: 0, max: 1, step: 0.05 }
  const frequencyConfig = { min: 0, max: 10, step: 0.1 }
  return {
    maxYaw: number('maxYaw', 0.05, numberConfig),
    maxPitch: number('maxPitch', 0.05, numberConfig),
    maxRoll: number('maxRoll', 0.05, numberConfig),
    yawFrequency: number('yawFrequency', 0.8, frequencyConfig),
    pitchFrequency: number('pitchFrequency', 0.8, frequencyConfig),
    rollFrequency: number('rollFrequency', 0.8, frequencyConfig),
  }
}

export const CameraShakeSt = () => <CameraShakeScene />
CameraShakeSt.storyName = 'Default'

export const CameraShakeWithOrbitSt = () => <CameraShakeWithOrbitScene />
CameraShakeWithOrbitSt.storyName = 'With OrbitControls'
