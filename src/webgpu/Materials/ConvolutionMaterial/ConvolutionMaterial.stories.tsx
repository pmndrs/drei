import * as React from 'react'
import { Vector2, Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { useTexture } from 'drei'
import { ConvolutionMaterial } from './ConvolutionMaterial'

export default {
  title: 'Materials/ConvolutionMaterial (WebGPU)',
  // `limitedTo` is what actually pins the renderer — Setup computes
  // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
  // so this stays on WebGPU whatever the toolbar says.
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        limitedTo="webgpu"
        controls={false}
        lights={false}
        floor={false}
        cameraPosition={new Vector3(0, 0, 6)}
      >
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta

type ConvolutionArgs = {
  /** Blur spread multiplier */
  scale: number
  /** Kernel offset for this pass (the real BlurPass cycles 0..3 across passes) */
  kernelValue: number
  /** Texel size denominator — the resolution the blur assumes */
  resolution: number
}

type Story = StoryObj<ConvolutionArgs>

/**
 * ConvolutionMaterial is a raw NodeMaterial, not a component: it is normally
 * driven by BlurPass across several ping-pong passes. This story wires a single
 * pass by hand onto a plane so the material itself can be seen at all — an
 * existing repo asset is used as the input buffer so a blank result cannot be
 * blamed on a failed download.
 */
function ConvolutionScene({ scale, kernelValue, resolution }: ConvolutionArgs) {
  const map = useTexture('/images/living-room-1.jpg')

  const material = React.useMemo(() => new ConvolutionMaterial(new Vector2(1 / 512, 1 / 512)), [])

  React.useLayoutEffect(() => {
    material.inputBuffer = map
    material.setTexelSize(1 / resolution, 1 / resolution)
    material.setResolution(new Vector2(resolution, resolution))
    material.scale = scale
    material.kernelValue = kernelValue
    material.useDepth = false
    material.needsUpdate = true
  }, [material, map, scale, kernelValue, resolution])

  React.useEffect(() => () => material.dispose(), [material])

  return (
    <>
      {/* Blurred through ConvolutionMaterial */}
      <mesh position={[-2.2, 0, 0]}>
        <planeGeometry args={[4, 3]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Untouched reference, so the blur is obviously the material's doing */}
      <mesh position={[2.2, 0, 0]}>
        <planeGeometry args={[4, 3]} />
        <meshBasicMaterial map={map} />
      </mesh>
    </>
  )
}

export const ConvolutionMaterialSt = {
  name: 'Default',
  render: (args) => (
    <React.Suspense fallback={null}>
      <ConvolutionScene {...args} />
    </React.Suspense>
  ),
  args: {
    scale: 4,
    kernelValue: 2,
    resolution: 256,
  },
  argTypes: {
    scale: { control: { type: 'range', min: 0, max: 20, step: 0.5 } },
    kernelValue: { control: { type: 'range', min: 0, max: 4, step: 1 } },
    resolution: { control: { type: 'range', min: 32, max: 1024, step: 32 } },
  },
} satisfies Story
