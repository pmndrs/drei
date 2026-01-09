import { createPortal, useFrame } from '@react-three/fiber'
import React, { ComponentProps, useRef, useState } from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { Box, CameraControls, CameraControlsImpl, PerspectiveCamera, Plane, useFBO } from '../../src'

export default {
  title: 'Controls/CameraControls',
  component: CameraControls,
} satisfies Meta<typeof CameraControls>

type Story = StoryObj<typeof CameraControls>

//

function CameraControlsScene1(props: ComponentProps<typeof CameraControls>) {
  const cameraControlRef = useRef<CameraControls>(null)

  return (
    <Setup controls={false}>
      <CameraControls ref={cameraControlRef} {...props} />
      <Box
        onClick={() => {
          cameraControlRef.current?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <meshBasicMaterial wireframe />
      </Box>
    </Setup>
  )
}

export const CameraControlsSt1 = {
  render: (args) => <CameraControlsScene1 {...args} />,
  name: 'Default',
} satisfies Story

//

const CameraControlsScene2 = (props: ComponentProps<typeof CameraControls>) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<THREE.PerspectiveCamera>(null!)
  const [virtualScene] = useState(() => new THREE.Scene())
  const cameraControlRef = useRef<CameraControls>(null!)

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

export const CameraControlsSt2 = {
  render: (args) => (
    <Setup controls={false}>
      <CameraControlsScene2 {...args} />
    </Setup>
  ),
  name: 'Custom Camera',
} satisfies Story

//

function CameraControlsScene3(props: ComponentProps<typeof CameraControls>) {
  const cameraControlRef = useRef<CameraControls>(null)

  return (
    <>
      <CameraControls
        ref={cameraControlRef}
        // {...props}
        // onWake={() => console.log('wake')}
        // onSleep={() => console.log('sleep')}
      />
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

export const CameraControlsSt3 = {
  render: (args) => (
    <Setup
      controls={false}
      frameloop="demand"
      //
    >
      <CameraControlsScene3 {...args} />
    </Setup>
  ),
  name: 'frameloop="demand"',
} satisfies Story

//

function CameraControlsScene4(props: ComponentProps<typeof CameraControls>) {
  const cameraControlRef = useRef<CameraControls>(null)

  return (
    <Setup controls={false}>
      <CameraControls ref={cameraControlRef} {...props} />
      <Box
        onClick={() => {
          cameraControlRef.current?.rotate(Math.PI / 4, 0, true)
        }}
      >
        <meshBasicMaterial wireframe />
      </Box>
    </Setup>
  )
}

class MyCameraControls extends CameraControlsImpl {
  override rotate(...args: Parameters<CameraControlsImpl['rotate']>) {
    console.log('rotate', ...args)
    return super.rotate(...args)
  }
}

export const CameraControlsSt4 = {
  render: (args) => <CameraControlsScene4 impl={MyCameraControls} {...args} />,
  name: 'Subclass',
} satisfies Story
