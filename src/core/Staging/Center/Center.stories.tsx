import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { Box, Center, Cylinder, Gltf } from 'drei'
import { Ref, useMemo, useState } from 'react'
import { Box3, Vector3 } from 'three'

export default {
  title: 'Staging/Center',
  component: Center,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(2, 2, 2)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Center>

type Story = StoryObj<typeof Center>

function LittlestTokyo({ catMeshRef }: { catMeshRef?: Ref<THREE.Mesh> }) {
  return (
    <group>
      <Gltf src="LittlestTokyo.glb" scale={0.002} />

      {catMeshRef && (
        // we draw a box around the cat
        <Box ref={catMeshRef} position={[0.095, 0.35, 0.25]} args={[0.2, 0.2, 0.2]}>
          <meshStandardMaterial color="green" transparent opacity={0.5} />
        </Box>
      )}
    </group>
  )
}

//

/**
 * `children` are centered, by default at (0,0,0)
 */
export const St1 = {
  render: () => (
    <>
      <axesHelper />
      <Center>
        <group
          position={[100, 100, 100]} // whatever inner position
        >
          <LittlestTokyo />
        </group>
      </Center>
    </>
  ),
  name: 'Default',
} satisfies Story

//

/**
 * if `position` is set, children are centered at that position
 */
export const St2 = {
  render: () => (
    <>
      <axesHelper />
      <Center position={[0, 1, 0]}>
        <group
          position={[100, 100, 100]} // whatever inner position
        >
          <LittlestTokyo />
        </group>
      </Center>
    </>
  ),
  name: '[position]',
} satisfies Story

//

/**
 * At `top` of centered position
 */
export const St3 = {
  render: () => (
    <>
      <axesHelper />
      <Center position={[0, 1, 0]} top>
        <group position={[100, 100, 100]}>
          <LittlestTokyo />
        </group>
      </Center>
    </>
  ),
  name: '[position][top]',
} satisfies Story

//

function St4Scene() {
  const [catMesh, setCatMesh] = useState<THREE.Mesh | null>(null)

  return (
    <>
      <axesHelper />
      <Center object={catMesh}>
        <group position={[100, 100, 100]}>
          <LittlestTokyo catMeshRef={setCatMesh} />
        </group>
      </Center>
    </>
  )
}

/**
 * An inner `object` can be specified: its bounding box will be used to center (instead of the one of `children`, by default).
 */

export const St4 = {
  render: () => <St4Scene />,
  name: '[object]',
} satisfies Story

//

function St5Scene() {
  const [catMesh, setCatMesh] = useState<THREE.Mesh | null>(null)

  return (
    <>
      <axesHelper />
      <Center object={catMesh} position={[0, 1, 0]} top>
        <group position={[100, 100, 100]}>
          <LittlestTokyo catMeshRef={setCatMesh} />
        </group>
      </Center>
    </>
  )
}

/**
 * Inner "cat mesh" centered at `top` of (0,1,0) position
 */

export const St5 = {
  render: () => <St5Scene />,
  name: '[object][position][top]',
} satisfies Story
