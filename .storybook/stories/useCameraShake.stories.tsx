import * as React from 'react'
import * as THREE from 'three'
import { Camera, useThree, useFrame, createPortal } from 'react-three-fiber'
import { withKnobs, object, button } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import {
  useCameraShake,
  ShakeConfig,
  ShakeController,
  PerspectiveCamera,
  OrthographicCamera,
  useMatcapTexture,
} from '../../src'

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
  const defaultConfig: ShakeConfig = {
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

  // The rerender on config change is just from storybook object() knob
  const shakeConfig = object('shakeConfig', defaultConfig)

  React.useEffect(() => {
    shaker.setConfig(shakeConfig)
  }, [shaker, shakeConfig])

  button('Toggle Decay', () => {
    shakeConfig.decay = !shakeConfig.decay
    return true
  })
  button('add 0.25 trauma', () => {
    shaker.addTrauma(0.25)
    return false
  })
  button('add 0.5 trauma', () => {
    shaker.addTrauma(0.5)
    return false
  })
  button('add 1 trauma', () => {
    shaker.addTrauma(1)
    return false
  })

  return null
}

// UI Lines to visualize the relationship between trauma and shake
function UIOverlay({ shaker }: { shaker: ShakeController }) {
  const { gl, scene, camera, size } = useThree()
  const uiScene = React.useMemo(() => new THREE.Scene(), [])
  const uiCam = React.useRef<THREE.Camera>()
  const tLineMat = React.useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 'red',
        linewidth: 7,
      }),
    []
  )
  const sLineMat = React.useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 'orange',
        linewidth: 7,
      }),
    []
  )
  const tLineGeo = React.useMemo(() => new THREE.BufferGeometry(), [])
  const sLineGeo = React.useMemo(() => new THREE.BufferGeometry(), [])
  const traumaLine = React.useRef<THREE.Line>(new THREE.Line(tLineGeo, tLineMat))
  const shakeLine = React.useRef<THREE.Line>(new THREE.Line(sLineGeo, sLineMat))

  useFrame(() => {
    gl.autoClear = true
    gl.render(scene, camera)
    gl.autoClear = false

    if (uiCam.current) {
      uiScene.clear()

      const t = shaker.getTrauma() // trauma
      const s = Math.pow(t, 2) // shake

      const bot = size.height / -2 + 25
      const top = size.height / 2 - 25

      traumaLine.current.geometry.setFromPoints([
        new THREE.Vector3(size.width / -2 + 25, bot, 0),
        new THREE.Vector3(size.width / -2 + 25, THREE.MathUtils.lerp(bot, top, t), 0),
      ])
      shakeLine.current.geometry.setFromPoints([
        new THREE.Vector3(size.width / -2 + 35, bot, 0),
        new THREE.Vector3(size.width / -2 + 35, THREE.MathUtils.lerp(bot, top, s), 0),
      ])

      uiScene.add(traumaLine.current)
      uiScene.add(shakeLine.current)

      gl.render(uiScene, uiCam.current)
    }
  }, 2)

  return createPortal(
    <>
      <OrthographicCamera ref={uiCam} makeDefault={false} position={[0, 0, 100]} />
    </>,
    uiScene
  ) as any // createPortal type possibly fixed with https://github.com/pmndrs/react-three-fiber/issues/925 ?
}

function CameraDolly({ controlledCam }: { controlledCam: React.MutableRefObject<Camera | undefined> }) {
  useFrame(({ clock }) => {
    if (controlledCam.current) {
      controlledCam.current.position.z = 25 + Math.sin(clock.getElapsedTime()) * 3
    }
  })

  return <PerspectiveCamera ref={controlledCam} makeDefault={false} />
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

function UseCameraShakeDemo() {
  const controlledCam = React.useRef<Camera>()
  const shaker = useCameraShake(controlledCam)

  return (
    <>
      <StoryBookKnobs shaker={shaker} />
      <React.Suspense fallback={null}>
        <Scene />
        <UIOverlay shaker={shaker} />
      </React.Suspense>
      <CameraDolly controlledCam={controlledCam} />
    </>
  )
}

export const UseAnimationsSt = () => <UseCameraShakeDemo />
UseAnimationsSt.storyName = 'Default'
