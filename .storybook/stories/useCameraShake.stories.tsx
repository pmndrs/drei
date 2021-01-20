import * as React from 'react'
import * as THREE from 'three'
import { Camera, useFrame } from 'react-three-fiber'
import { withKnobs, button } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { useCameraShake, ShakeConfigPartial, ShakeController, PerspectiveCamera, useMatcapTexture } from '../../src'

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
  const knot = React.useRef<THREE.Mesh>()
  const [knotMatcap] = useMatcapTexture('293534_B2BFC5_738289_8A9AA7', 512)
  const [cubeMatcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5', 512)

  useFrame(() => {
    if (knot.current) {
      knot.current.rotation.x = knot.current.rotation.y += 0.01
    }
  })

  return (
    <>
      <mesh ref={knot}>
        <torusKnotBufferGeometry args={[1.5, 0.5, 128, 32]} />
        <meshMatcapMaterial matcap={knotMatcap} />
      </mesh>
      <mesh position={[-5, 5, 0]}>
        <boxBufferGeometry args={[5, 5, 5]} />
        <meshMatcapMaterial matcap={cubeMatcap} />
      </mesh>
      <mesh position={[5, 5, 0]}>
        <boxBufferGeometry args={[5, 5, 5]} />
        <meshMatcapMaterial matcap={cubeMatcap} />
      </mesh>
      <mesh position={[-5, -5, 0]}>
        <boxBufferGeometry args={[5, 5, 5]} />
        <meshMatcapMaterial matcap={cubeMatcap} />
      </mesh>
      <mesh position={[5, -5, 0]}>
        <boxBufferGeometry args={[5, 5, 5]} />
        <meshMatcapMaterial matcap={cubeMatcap} />
      </mesh>
    </>
  )
}

function UseCameraShakeDemo({ cfg }) {
  const controlledCam = React.useRef<Camera>()
  const shaker = useCameraShake(controlledCam, cfg)

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
  decay: true,
  decayRate: 0.75,
  maxYaw: 0.1,
  maxPitch: 0.1,
  maxRoll: 0.1,
  yawFrequency: 10,
  pitchFrequency: 10,
  rollFrequency: 10,
  yawNoiseSeed: 10,
  pitchNoiseSeed: 20,
  rollNoiseSeed: 30,
}

export const UseAnimationsSt = ({ ...args }) => <UseCameraShakeDemo cfg={args} />
UseAnimationsSt.storyName = 'Default'
UseAnimationsSt.args = { ...controlsConfig }
