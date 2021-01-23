import * as React from 'react'
import * as THREE from 'three'
import { Camera, useFrame } from 'react-three-fiber'

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

function CameraDolly({ cam }: { cam: React.MutableRefObject<Camera | undefined> }) {
  useFrame(({ clock }) => {
    if (cam.current) {
      cam.current.position.z = 25 + Math.sin(clock.getElapsedTime()) * 3
    }
  })
  return <PerspectiveCamera ref={cam} makeDefault={false} />
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
  const controlledCam = React.useRef<Camera>()

  useCameraShake(controlledCam, cfg)

  return (
    <>
      <CameraDolly cam={controlledCam} />
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
  yawFrequency: 1,
  pitchFrequency: 1,
  rollFrequency: 1,
}

export const UseCameraShakeSt = ({ ...args }) => <UseCameraShakeDemo cfg={args} />
UseCameraShakeSt.storyName = 'Default'
UseCameraShakeSt.args = { ...controlsConfig }
