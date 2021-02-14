import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'

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

function CameraShakeScene({ cfg }) {
  const cameraRig = React.useRef()

  return (
    <>
      <React.Suspense fallback={null}>
        <CameraShake {...cfg} ref={cameraRig} />
        <Scene />
      </React.Suspense>
    </>
  )
}

function CameraShakeWithOrbitScene({ cfg }) {
  return (
    <>
      <React.Suspense fallback={null}>
        <OrbitControls />
        <CameraShake {...cfg} additive />
        <Scene />
      </React.Suspense>
    </>
  )
}

const controlsConfig = {
  maxYaw: 0.05,
  maxPitch: 0.05,
  maxRoll: 0.05,
  yawFrequency: 0.8,
  pitchFrequency: 0.8,
  rollFrequency: 0.8,
}

export const CameraShakeSt = ({ ...args }) => <CameraShakeScene cfg={args} />
CameraShakeSt.storyName = 'Default'
CameraShakeSt.args = { ...controlsConfig }

export const CameraShakeWithOrbitSt = ({ ...args }) => <CameraShakeWithOrbitScene cfg={args} />
CameraShakeWithOrbitSt.storyName = 'With OrbitControls'
CameraShakeWithOrbitSt.args = { ...controlsConfig }
