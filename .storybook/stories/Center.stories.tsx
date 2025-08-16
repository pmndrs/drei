import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '../Setup'

import { Box, Center, Gltf } from '../../src'
import { Ref, useMemo, useState } from 'react'
import { Box3, Vector3 } from 'three'

export default {
  title: 'Staging/Center',
  component: Center,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(2, 2, 2)}>
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

export const St1 = {
  render: () => (
    <>
      <axesHelper />
      <Center>
        <group position={[100, 100, 100]}>
          <LittlestTokyo />
        </group>
      </Center>
    </>
  ),
  name: 'Default',
} satisfies Story

//

export const St2 = {
  render: () => (
    <>
      <axesHelper />
      <Center top>
        <group position={[100, 100, 100]}>
          <LittlestTokyo />
        </group>
      </Center>
    </>
  ),
  name: '[top]',
} satisfies Story

//

function St3Scene() {
  const [catMesh, setCatMesh] = useState<THREE.Mesh | null>(null)

  const box3 = useMemo(() => {
    if (!catMesh) return undefined
    return new Box3().setFromObject(catMesh)
  }, [catMesh])

  return (
    <>
      <axesHelper />
      <Center box3={box3}>
        <group position={[100, 100, 100]}>
          <LittlestTokyo catMeshRef={setCatMesh} />
        </group>
      </Center>
    </>
  )
}

export const St3 = {
  render: () => <St3Scene />,
  name: '[box3]',
} satisfies Story
