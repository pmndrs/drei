import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'

import { Setup } from '../Setup'

import { useCameraShake, ShakeConfigPartial, PerspectiveCamera } from '../../src'

export default {
  title: 'Camera/useCameraShake',
  component: useCameraShake,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)} controls={false}>
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

function UseCameraShakeDemo({ cfg }) {
  const camRef = useCameraShake(cfg)

  useFrame(({ clock }) => {
    if (camRef.current) {
      camRef.current.position.z = 25 + Math.sin(clock.getElapsedTime()) * 3
    }
  })

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault />
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
  yawFrequency: 0.1,
  pitchFrequency: 0.1,
  rollFrequency: 0.1,
  decay: true,
  decayRate: 0.1,
}

export const UseCameraShakeSt = ({ ...args }) => <UseCameraShakeDemo cfg={args} />
UseCameraShakeSt.storyName = 'Default'
UseCameraShakeSt.args = { ...controlsConfig }
