import * as React from 'react'
import * as THREE from 'three'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { CameraShake, OrbitControls } from '../../src'

const frequencyArgType = {
  control: {
    max: 10,
    min: 0,
    step: 0.1,
    type: 'range',
  },
}

const numberArgType = {
  control: {
    max: 1,
    min: 0,
    step: 0.05,
    type: 'range',
  },
}

const args = {
  maxPitch: 0.05,
  maxRoll: 0.05,
  maxYaw: 0.05,
  pitchFrequency: 0.8,
  rollFrequency: 0.8,
  yawFrequency: 0.8,
}

const argTypes = {
  maxPitch: numberArgType,
  maxRoll: numberArgType,
  maxYaw: numberArgType,
  pitchFrequency: frequencyArgType,
  rollFrequency: frequencyArgType,
  yawFrequency: frequencyArgType,
}

export default {
  title: 'Staging/CameraShake',
  component: CameraShake,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 10)} controls={false}>
        {storyFn()}
      </Setup>
    ),
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
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial wireframe color="white" />
      </mesh>
      <mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <planeGeometry args={[200, 200, 75, 75]} />
        <meshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export const CameraShakeStory = ({ ...args }) => (
  <>
    <React.Suspense fallback={null}>
      <CameraShake {...args} />
      <Scene />
    </React.Suspense>
  </>
)

CameraShakeStory.args = args
CameraShakeStory.argTypes = argTypes
CameraShakeStory.storyName = 'Default'

export const CameraShakeWithOrbitControlsStory = ({ ...args }) => {
  const controlsRef = React.useRef<OrbitControlsImpl>(null)
  return (
    <>
      <React.Suspense fallback={null}>
        <OrbitControls ref={controlsRef} />
        <CameraShake {...args} controls={controlsRef} />
        <Scene />
      </React.Suspense>
    </>
  )
}

CameraShakeWithOrbitControlsStory.args = args
CameraShakeWithOrbitControlsStory.argTypes = argTypes
CameraShakeWithOrbitControlsStory.storyName = 'With OrbitControls'
