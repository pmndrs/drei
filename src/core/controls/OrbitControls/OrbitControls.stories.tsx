import { createPortal, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Scene } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { Box, OrbitControls, PerspectiveCamera, Plane, useFBO, type OrbitControlsProps } from 'drei'

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  args: {
    enableDamping: true,
    enablePan: true,
    enableRotate: true,
    enableZoom: true,
    reverseOrbit: false,
  },
  decorators: [
    (Story, context) => (
      <Setup controls={false} renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof OrbitControls>

type Story = StoryObj<typeof OrbitControls>

function OrbitControlsScene(props: React.ComponentProps<typeof OrbitControls>) {
  return (
    <>
      <OrbitControls {...props} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

export const OrbitControlsStory = {
  render: (args) => (
    <>
      <OrbitControls {...args} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  ),
  name: 'Default',
  parameters: {
    docs: {
      source: {
        code: `<>
  <OrbitControls {...args} />
  <Box>
    <meshBasicMaterial wireframe />
  </Box>
</>`,
      },
    },
  },
} satisfies Story

//

const CustomCamera = (props: OrbitControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<React.ComponentRef<typeof PerspectiveCamera> | null>(null)
  const [virtualScene] = useState(() => new Scene())

  useFrame(({ renderer }) => {
    if (virtualCamera.current) {
      renderer.setRenderTarget(fbo)
      renderer.render(virtualScene, virtualCamera.current)

      renderer.setRenderTarget(null)
    }
  })

  return (
    <>
      <Plane args={[4, 4, 4]}>
        <meshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <meshBasicMaterial wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />
          <OrbitControls camera={virtualCamera.current || undefined} {...props} />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = {
  render: (args) => <CustomCamera {...args} />,
  name: 'Custom Camera',
  parameters: {
    docs: {
      source: {
        code: `<>
      <Plane args={[4, 4, 4]}>
        <meshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <meshBasicMaterial wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />
          <OrbitControls camera={virtualCamera.current || undefined} {...props} />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>`,
      },
    },
  },
} satisfies Story
