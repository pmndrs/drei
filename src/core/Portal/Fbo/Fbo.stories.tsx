import * as React from 'react'
import * as THREE from 'three'
import { createPortal, useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Fbo, TorusKnot, Box, PerspectiveCamera } from 'drei'
import { RenderTarget } from '#drei-platform'

export default {
  title: 'Portals/Fbo',
  component: Fbo,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Fbo>

type Story = StoryObj<typeof Fbo>

function SpinningThing() {
  const mesh = React.useRef<React.ComponentRef<typeof TorusKnot>>(null!)

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01
  })

  return (
    <TorusKnot ref={mesh} args={[1, 0.4, 100, 64]}>
      <meshNormalMaterial />
    </TorusKnot>
  )
}

function FboScene(props: React.ComponentProps<typeof Fbo>) {
  return <Fbo {...props}>{(target) => <TargetWrapper target={target} />}</Fbo>
}

function TargetWrapper({ target }: { target: THREE.WebGLRenderTarget }) {
  const cam = React.useRef<React.ComponentRef<typeof PerspectiveCamera>>(null!)

  const scene = React.useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('orange')
    return scene
  }, [])

  useFrame(({ renderer, elapsed }) => {
    cam.current.position.z = 5 + Math.sin(elapsed * 1.5) * 2
    renderer.setRenderTarget(target)
    renderer.render(scene, cam.current)
    renderer.setRenderTarget(null)
  })

  return (
    <>
      <PerspectiveCamera ref={cam} position={[0, 0, 3]} />
      {createPortal(<SpinningThing />, scene)}
      <Box args={[3, 3, 3]}>
        <meshStandardMaterial map={target?.texture} />
      </Box>
    </>
  )
}

export const FboSt = {
  args: { width: 512, height: 512, samples: 4, stencilBuffer: false, format: THREE.RGBAFormat }, // WebGPU only supports samples 1 and 4
  argTypes: {
    width: { control: 'range', min: 1, max: 2048, step: 1 },
    height: { control: 'range', min: 1, max: 2048, step: 1 },
    samples: { control: 'range', min: 0, max: 64, step: 1 },
  },
  render: (args) => <FboScene {...args} />,
  name: 'Default',
} satisfies Story

//* Platform guard ==============================
// #drei-platform must follow the Storybook build (DREI_RENDERER, see .storybook/main.mts): the
// default build tests what the root entry ships (a three/webgpu RenderTarget, which useFBO
// returns), the legacy build what /legacy ships (a WebGLRenderTarget). A play function, because it
// runs after render whatever the renderer's init timing; throwing fails the story run (#2875).

export const PlatformTarget = {
  name: 'Platform target',
  render: () => <></>,
  play: async () => {
    const target = new RenderTarget(1, 1) as { isWebGLRenderTarget?: boolean; dispose(): void }
    const isWebGLTarget = target.isWebGLRenderTarget === true
    target.dispose()
    if (isWebGLTarget !== (__DREI_RENDERER__ === 'legacy')) {
      throw new Error(
        `#drei-platform gave a ${isWebGLTarget ? 'WebGL' : 'WebGPU'} render target in the ${__DREI_RENDERER__} Storybook build (#2875)`
      )
    }
  },
} satisfies Story
