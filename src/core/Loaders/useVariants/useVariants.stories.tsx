import * as React from 'react'
import { Vector3 } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'

import { useGLTF, useVariants } from 'drei'

useGLTF.preload('MaterialsVariantsShoe.glb')

interface UseVariantsSceneProps {
  inVariant: string
}

function UseVariantsScene({ inVariant }: UseVariantsSceneProps) {
  const gltf = useGLTF('MaterialsVariantsShoe.glb') as GLTF
  const { variants, activeVariant, setVariant, materials } = useVariants(gltf, inVariant)
  return (
    <>
      <color attach="background" args={['#FFBE85']} />
      <group position={[0, -0.5, 0]}>
        <group dispose={null} scale={10}>
          <primitive object={gltf.scene} />
        </group>
      </group>
    </>
  )
}

export default {
  title: 'Loaders/useVariants',
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 2)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta

type Story = StoryObj<typeof UseVariantsScene>

export const UseVariantsSt = {
  args: {
    inVariant: 'midnight',
  },
  argTypes: {
    inVariant: { control: 'select', options: ['street', 'beach', 'midnight', 'storm(not in model)'] },
  },
  render: (args) => <UseVariantsScene {...args} />,
  name: 'Default',
} satisfies Story
