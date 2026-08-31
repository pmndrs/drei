import * as React from 'react'
import { Suspense, useState } from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Mask, useMask, Bounds, PivotControls, Environment, OrbitControls, RoundedBox, Float } from 'drei'

export default {
  title: 'Portals/Mask',
  component: Mask,
  decorators: [
    (Story, context) => (
      <Setup
        renderer={context.globals.renderer}
        cameraPosition={new Vector3(0, 0, 8)}
        controls={false}
        lights={false}
        floor={false}
        rendererParams={{ stencil: true }}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Mask>

type Story = StoryObj<typeof Mask>

//* Pivot Controls ==============================
// In stories because of dual imports we have to pass the line component. It shouldnt need this in prod
import { Line as LegacyLine } from '@legacy/Geometry/Line'
import { Line as WebGPULine } from '@webgpu/Geometry/Line'
import { useThree } from '@react-three/fiber'
function useLineComponent() {
  const renderer = useThree((state) => state.renderer)
  // Check if WebGPU renderer (has 'backend' property)
  const isWebGPU = 'backend' in renderer
  // Cast needed: legacy and webgpu Line have incompatible material types
  // but are functionally interchangeable for PivotControls usage
  return (isWebGPU ? WebGPULine : LegacyLine) as any
}

//* Helper Components ==============================

// Circular Mask Frame ---------------------------------
const CircularMask = (props: any) => {
  const LineComponent = useLineComponent()
  return (
    <group {...props}>
      <PivotControls
        offset={[0, 0, 1]}
        activeAxes={[true, true, false]}
        disableRotations
        depthTest={false}
        LineComponent={LineComponent}
      >
        <Frame position={[0, 0, 1]} />
        <Mask id={1} position={[0, 0, 0.95]}>
          <circleGeometry args={[0.8, 64]} />
        </Mask>
      </PivotControls>
    </group>
  )
}

// Box Component ---------------------------------
const Box = ({ args = [1, 4, 1], radius = 0.05, smoothness = 4, color = 'black', ...boxProps }) => (
  // @ts-expect-error - spread props from parent may include ref type mismatch
  <RoundedBox args={args} radius={radius} smoothness={smoothness} {...boxProps}>
    <meshPhongMaterial color={color} />
  </RoundedBox>
)

// Frame Component ---------------------------------
const Frame = (props: any) => (
  <mesh {...props}>
    <ringGeometry args={[0.785, 0.85, 64]} />
    <meshPhongMaterial color="black" />
  </mesh>
)

// Masked Sphere ---------------------------------
function MaskedSphere({ invert }: { invert: boolean }) {
  const stencil = useMask(1, invert)
  return (
    <mesh castShadow receiveShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshPhongMaterial color="#33BBFF" {...stencil} />
    </mesh>
  )
}

//* Mask Scene ==============================

function MaskScene() {
  const [invert, setInvert] = useState(false)

  return (
    <>
      <directionalLight position={[1, 2, 1.5]} intensity={0.5} castShadow />
      <hemisphereLight intensity={1.5} groundColor="red" />

      <Suspense fallback={null}>
        <CircularMask />
        <CircularMask position={[2, 0, 0]} />

        <Bounds fit clip observe>
          <Float floatIntensity={4} rotationIntensity={0} speed={4}>
            <MaskedSphere invert={invert} />
          </Float>

          <Box color="#EAC435" args={[1, 5, 1]} rotation-y={Math.PI / 4} position={[0, 0, -2]} />
          <Box color="#03CEA4" args={[2, 2, 2]} position={[-2, 0, -2]} />
          <Box color="#FB4D3D" args={[2, 2, 2]} position={[2, 0, -2]} />
        </Bounds>

        <Environment preset="city" />
      </Suspense>

      <OrbitControls makeDefault />

      {/* Control button to toggle invert */}
      <mesh position={[0, -3, 0]} onClick={() => setInvert(!invert)}>
        <planeGeometry args={[2, 0.5]} />
        <meshBasicMaterial color={invert ? '#ff6b6b' : '#4ecdc4'} />
      </mesh>
    </>
  )
}

//* Stories ==============================

export const MaskSt = {
  render: () => <MaskScene />,
  name: 'Default',
} satisfies Story
