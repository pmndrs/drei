import * as React from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from 'react-three-fiber'

import { Setup } from '../Setup'

import { useCameraShake, ShakeConfigPartial, OrbitControls } from '../../src'

export default {
  title: 'Camera/useCameraShake',
  component: useCameraShake,
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

function UseCameraShakeScene({ cfg }) {
  const { camera } = useThree()
  useCameraShake(camera, cfg)

  return (
    <>
      <React.Suspense fallback={null}>
        <Scene />
      </React.Suspense>
    </>
  )
}

function UseCameraShakeWithOrbitScene({ cfg }) {
  const { camera } = useThree()
  useCameraShake(camera, cfg)

  return (
    <>
      <OrbitControls />
      <React.Suspense fallback={null}>
        <Scene />
      </React.Suspense>
    </>
  )
}

const controlsConfig: ShakeConfigPartial = {
  maxYaw: 0.05,
  maxPitch: 0.05,
  maxRoll: 0.05,
  yawFrequency: 0.8,
  pitchFrequency: 0.8,
  rollFrequency: 0.8,
}

export const UseCameraShakeSt = ({ ...args }) => <UseCameraShakeScene cfg={args} />
UseCameraShakeSt.storyName = 'Default'
UseCameraShakeSt.args = { ...controlsConfig }

export const UseCameraShakeWithOrbitSt = ({ ...args }) => <UseCameraShakeWithOrbitScene cfg={args} />
UseCameraShakeWithOrbitSt.storyName = 'With OrbitControls'
UseCameraShakeWithOrbitSt.args = { ...controlsConfig }
