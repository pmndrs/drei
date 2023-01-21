import { createPortal, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Scene } from 'three'

import { Setup } from '../Setup'
import { Box, CameraControls, PerspectiveCamera, Plane, useFBO } from '../../src'

import type { Camera } from 'three'
import type { CameraControlsProps } from '../../src'

const args = {}

export const CameraControlsStory = (props: CameraControlsProps) => {
  const cameraControlRef = useRef<CameraControls | null>(null)

  return (
    <>
      <CameraControls ref={cameraControlRef} {...props} />
      <Box
        onClick={() => {
          cameraControlRef.current?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

CameraControlsStory.args = args
CameraControlsStory.storyName = 'Default'

export default {
  title: 'Controls/CameraControls',
  component: CameraControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const CustomCamera = (props: CameraControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<CameraControls['camera']>()
  const [virtualScene] = useState(() => new Scene())
  const cameraControlRef = useRef<CameraControls | null>(null)

  useFrame(({ gl }) => {
    if (virtualCamera.current) {
      gl.setRenderTarget(fbo)
      gl.render(virtualScene, virtualCamera.current)

      gl.setRenderTarget(null)
    }
  })

  return (
    <>
      <Plane
        args={[4, 4, 4]}
        onClick={() => {
          cameraControlRef.current?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <meshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <meshBasicMaterial wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />
          <CameraControls ref={cameraControlRef} camera={virtualCamera.current} {...props} />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = (props: CameraControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
