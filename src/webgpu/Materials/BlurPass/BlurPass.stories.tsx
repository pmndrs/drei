import * as React from 'react'
import * as THREE from 'three/webgpu'
import { Vector3 } from 'three/webgpu'
import { Meta, StoryObj } from '@storybook/react-vite'
import { useFrame, useThree } from '@react-three/fiber'

import { Setup } from '@sb/Setup'
import { OrbitControls } from 'drei'
import { BlurPass } from './BlurPass'

//* Demo Scene ==============================
// BlurPass is a class, not a component, so the story drives it through a small
// harness: an offscreen scene is rendered to a source target, blurred into a
// second target, and both are shown side by side.

type BlurPassDemoProps = {
  /** Size of the internal ping-pong targets */
  resolution: number
  /** Blur spread multiplier (ConvolutionMaterial.scale) */
  scale: number
}

/**
 * Primitives rather than a GLTF: if this renders nothing, the cause should be
 * the component and not an asset that failed to load. Tracked in #2659.
 */
function BlurPassDemo({ resolution, scale }: BlurPassDemoProps) {
  const renderer = useThree((state) => state.renderer) as unknown as THREE.Renderer

  const { source, blurred, blurPass, offscreen, camera, spinner } = React.useMemo(() => {
    const source = new THREE.RenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    })
    const blurred = source.clone()

    const blurPass = new BlurPass({ resolution, width: resolution, height: resolution })

    // High-frequency content so the blur is unmistakable.
    const offscreen = new THREE.Scene()
    offscreen.background = new THREE.Color('#101024')

    const spinner = new THREE.Group()
    const boxGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35)
    const palette = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0']
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const material = new THREE.MeshBasicNodeMaterial()
        material.color = new THREE.Color(palette[(x + y + 4) % palette.length])
        const box = new THREE.Mesh(boxGeometry, material)
        box.position.set(x * 0.7, y * 0.7, 0)
        spinner.add(box)
      }
    }
    offscreen.add(spinner)

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    return { source, blurred, blurPass, offscreen, camera, spinner }
  }, [resolution])

  React.useEffect(() => {
    blurPass.convolutionMaterial.scale = scale
  }, [blurPass, scale])

  React.useEffect(() => {
    return () => {
      source.dispose()
      blurred.dispose()
      blurPass.dispose()
      offscreen.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          ;(object.material as THREE.Material).dispose()
        }
      })
    }
  }, [source, blurred, blurPass, offscreen])

  useFrame((state) => {
    spinner.rotation.y = state.elapsed
    spinner.rotation.x = state.elapsed * 0.4

    // 1. Render the offscreen scene into the source target.
    renderer.setRenderTarget(source)
    renderer.render(offscreen, camera)

    // 2. Ping-pong blur it into the second target.
    blurPass.render(renderer, source, blurred)

    // 3. Hand the canvas back to r3f.
    renderer.setRenderTarget(null)
  })

  return (
    <>
      <mesh position={[-1.1, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={source.texture} toneMapped={false} />
      </mesh>
      <mesh position={[1.1, 0, 0]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial map={blurred.texture} toneMapped={false} />
      </mesh>
      <OrbitControls autoRotate={false} />
    </>
  )
}

export default {
  title: 'Materials/BlurPass (WebGPU)',
  component: BlurPassDemo,
  // This is the src/webgpu implementation, so it cannot run on the WebGL
  // renderer — pin it rather than letting the toolbar toggle break it.
  decorators: [
    (Story, context) => (
      // `limitedTo` is what actually pins the renderer — Setup computes
      // isLegacy = limitedTo === 'legacy' || (limitedTo === null && renderer === 'legacy')
      // so this stays on WebGPU whatever the toolbar says.
      <Setup renderer={context.globals.renderer} limitedTo="webgpu" cameraPosition={new Vector3(0, 0, 4)}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['webgpuOnly'],
} satisfies Meta<typeof BlurPassDemo>

type Story = StoryObj<typeof BlurPassDemo>

/** Left plane: the unblurred source target. Right plane: the same target after BlurPass. */
export const BlurPassSt = {
  name: 'Default',
  render: (args) => <BlurPassDemo {...args} />,
  args: {
    resolution: 256,
    scale: 1,
  },
  argTypes: {
    resolution: { control: { type: 'select' }, options: [128, 256, 512] },
    scale: { control: { type: 'range', min: 0, max: 4, step: 0.1 } },
  },
} satisfies Story
