import * as React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'
import { useGLTF, ScrollControls, Scroll, useCursor, useIntersect } from '../../src'

export default {
  title: 'Controls/ScrollControls',
  component: ScrollControls,
  args: {
    pages: 3, // Each page takes 100% of the height of the canvas
    distance: 1, // A factor that increases scroll bar travel (default: 1)
    damping: 4, // Friction, higher is faster (default: 4)
    horizontal: false, // Can also scroll horizontally (default: false)
    infinite: false, // Can also scroll infinitely (default: false)
  },
} satisfies Meta<typeof ScrollControls>

type Story = StoryObj<typeof ScrollControls>

function Suzanne(props: React.ComponentProps<'group'>) {
  const { nodes } = useGLTF('suzanne.glb', true)

  const [hovered, setHovered] = React.useState(false)
  useCursor(hovered)

  const visible = React.useRef(false)
  const meshRef = useIntersect((isVisible) => (visible.current = isVisible))

  const { height } = useThree((state) => state.viewport)
  useFrame((_state, delta) => {
    meshRef.current.rotation.x = THREE.MathUtils.damp(
      meshRef.current.rotation.x,
      visible.current ? 0 : -height / 2 + 1,
      4,
      delta
    )
  })

  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        geometry={(nodes.Suzanne as THREE.Mesh).geometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={hovered ? 'green' : 'blue'} />
      </mesh>
    </group>
  )
}

const ScrollControlsScene = (props: React.ComponentProps<typeof ScrollControls>) => {
  const viewport = useThree((state) => state.viewport)
  const canvasSize = useThree((state) => state.size)
  return (
    <ScrollControls {...props}>
      {/* You can have components in here, they are not scrolled, but they can still
          react to scroll by using useScroll! */}
      <Scroll>
        <Suzanne position={[0, 0, 0]} scale={[2, 2, 2]} />
        <Suzanne position={[-viewport.width / 8, -viewport.height * 1, 0]} scale={[3, 3, 3]} />
        <Suzanne position={[viewport.width / 4, -viewport.height * 2, 0]} scale={[1.5, 1.5, 1.5]} />
      </Scroll>
      <Scroll html style={{ width: '100%', color: '#EC2D2D' }}>
        {/*
        If the canvas is 100% of viewport then:
          top: `${canvasSize.height * 1.0}px`
        is equal to:
          top: `100vh`
        */}
        <h1 style={{ position: 'absolute', top: `${canvasSize.height * 0.1}px`, right: `${canvasSize.width * 0.2}px` }}>
          Scroll down!
        </h1>
        <h1
          style={{
            position: 'absolute',
            top: `${canvasSize.height * 1.0}px`,
            right: `${canvasSize.width * 0.2}px`,
            fontSize: '25em',
            transform: `translate3d(0,-100%,0)`,
          }}
        >
          all
        </h1>
        <h1 style={{ position: 'absolute', top: `${canvasSize.height * 1.8}px`, left: `${canvasSize.width * 0.1}px` }}>
          hail
        </h1>
        <h1 style={{ position: 'absolute', top: `${canvasSize.height * 2.6}px`, right: `${canvasSize.width * 0.1}px` }}>
          thee,
        </h1>
        <h1 style={{ position: 'absolute', top: `${canvasSize.height * 3.5}px`, left: `${canvasSize.width * 0.1}px` }}>
          thoth
        </h1>
        <h1 style={{ position: 'absolute', top: `${canvasSize.height * 4.5}px`, right: `${canvasSize.width * 0.1}px` }}>
          her
          <br />
          mes.
        </h1>
      </Scroll>
    </ScrollControls>
  )
}

const ScrollControlsSetup = ({ children }) => (
  <Setup
    controls={false}
    orthographic
    camera={{ zoom: 80 }}
    gl={{ alpha: false, antialias: false, stencil: false, depth: false }}
    dpr={[1, 1.5]}
  >
    {children}
  </Setup>
)

export const ScrollControlsSt = {
  decorators: [
    (Story) => (
      <ScrollControlsSetup>
        <Story />
      </ScrollControlsSetup>
    ),
  ],
  render: (args) => <ScrollControlsScene {...args} />,
  name: 'Default',
} satisfies Story

//

const Container = ({ children }) => (
  <div
    style={{
      margin: '50px',
      padding: '50px',
      height: 'calc(100vh - 200px)',
      position: 'relative',
    }}
  >
    {children}
  </div>
)

export const ScrollControlsContainerSt = {
  decorators: [
    (Story) => (
      <Container>
        <ScrollControlsSetup>
          <Story />
        </ScrollControlsSetup>
      </Container>
    ),
  ],
  render: (args) => <ScrollControlsScene {...args} />,
  name: 'Inside a container',
} satisfies Story
