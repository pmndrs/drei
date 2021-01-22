import * as React from 'react'
import * as THREE from 'three'
import { Camera, useFrame } from 'react-three-fiber'
import { withKnobs, button } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { useCameraShake, ShakeConfigPartial, ShakeController, PerspectiveCamera } from '../../src'

export default {
  title: 'Camera/useCameraShake',
  component: useCameraShake,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)} controls={false}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function StoryBookKnobs({ shaker }: { shaker: ShakeController }) {
  button('Add 1 trauma', () => {
    shaker.addTrauma(1)
    return false
  })
  button('Add 0.75 trauma', () => {
    shaker.addTrauma(0.5)
    return false
  })
  button('Add 0.5 trauma', () => {
    shaker.addTrauma(0.5)
    return false
  })
  button('Add 0.25 trauma', () => {
    shaker.addTrauma(0.25)
    return false
  })
  button('Clear trauma', () => {
    shaker.clearTrauma()
    return false
  })

  return null
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
  const shaker = useCameraShake(controlledCam, cfg, 0.5)

  React.useEffect(() => {
    shaker.updateConfig({ ...cfg })
  }, [cfg])

  return (
    <>
      <StoryBookKnobs shaker={shaker} />
      <CameraDolly cam={controlledCam} />
      <React.Suspense fallback={null}>
        <Scene />
      </React.Suspense>
    </>
  )
}

const controlsConfig: ShakeConfigPartial = {
  decay: false,
  decayRate: 0.75,
  maxYaw: 0.1,
  maxPitch: 0.1,
  maxRoll: 0.1,
  yawFrequency: 2,
  pitchFrequency: 2,
  rollFrequency: 2,
  yawNoiseSeed: 10,
  pitchNoiseSeed: 20,
  rollNoiseSeed: 30,
}

export const UseCameraShakeSt = ({ ...args }) => <UseCameraShakeDemo cfg={args} />
UseCameraShakeSt.storyName = 'Default'
UseCameraShakeSt.args = { ...controlsConfig }
