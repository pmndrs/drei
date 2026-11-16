/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { spring, spring3 } from 'math/time'

import { Setup } from '@sb/Setup'

import { FaceLandmarker, FaceControls, Box, WebcamVideoTexture } from 'drei'
import { ComponentProps, ComponentRef, useRef, useState } from 'react'
import { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { useFrame, useThree } from '@react-three/fiber'

export default {
  title: 'Controls/FaceControls',
  tags: ['external', '!autodocs'], // FaceLandmarker cannot have multiple instances
  component: FaceControls,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraFov={60}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof FaceControls>

type Story = StoryObj<typeof FaceControls>

//

function FaceControlsScene(props: ComponentProps<typeof FaceControls>) {
  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls {...props} />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt = {
  render: (args) => <FaceControlsScene {...args} />,
  name: 'Default',
} satisfies Story

//

function FaceControlsScene2(props: ComponentProps<typeof FaceControls>) {
  const faceLandmarkerRef = useRef<ComponentRef<typeof FaceLandmarker>>(null)
  const videoTextureRef = useRef<ComponentRef<typeof WebcamVideoTexture>>(null)

  const [faceLandmarkerResult, setFaceLandmarkerResult] = useState<FaceLandmarkerResult>()

  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker ref={faceLandmarkerRef}>
          <WebcamVideoTexture
            ref={videoTextureRef}
            onVideoFrame={(now) => {
              const faceLandmarker = faceLandmarkerRef.current
              const videoTexture = videoTextureRef.current
              if (!faceLandmarker || !videoTexture) return

              const videoFrame = videoTexture.source.data
              const result = faceLandmarker.detectForVideo(videoFrame, now)
              setFaceLandmarkerResult(result)
            }}
          />

          <FaceControls {...props} manualDetect faceLandmarkerResult={faceLandmarkerResult} />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt2 = {
  render: (args) => <FaceControlsScene2 {...args} />,
  name: 'manualDetect',
} satisfies Story

//

function FaceControlsScene3(props: ComponentProps<typeof FaceControls>) {
  const faceControlsRef = useRef<ComponentRef<typeof FaceControls>>(null)

  const camera = useThree((state) => state.camera)
  const [current] = useState(() => new THREE.Object3D())
  const [springs] = useState(() => ({
    position: spring3.create(),
    x: spring.create(),
    y: spring.create(),
    z: spring.create(),
  }))

  useFrame((_, delta) => {
    const target = faceControlsRef.current?.computeTarget()

    if (target) {
      //
      // A. Define your own damping
      //

      const { position: p, rotation: r } = target
      current.position.fromArray(spring3.damp(springs.position, [p.x, p.y, p.z], 0.25, delta).value)
      current.rotation.set(
        spring.dampAngle(springs.x, r.x, 0.25, delta).value,
        spring.dampAngle(springs.y, r.y, 0.25, delta).value,
        spring.dampAngle(springs.z, r.z, 0.25, delta).value
      )
      camera.position.copy(current.position)
      camera.rotation.copy(current.rotation)

      //
      // B. Or maybe with no damping at all?
      //

      // camera.position.copy(target.position)
      // camera.rotation.copy(target.rotation)
    }
  })

  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls ref={faceControlsRef} {...props} manualUpdate />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt3 = {
  render: (args) => <FaceControlsScene3 {...args} />,
  name: 'manualUpdate',
} satisfies Story
