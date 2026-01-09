import * as React from 'react'

import { Mesh, Vector2, Vector3 } from 'three'

import { Setup } from '@sb/Setup'
import { useGLTF, NormalTexture } from 'drei'
import { Meta, StoryObj } from '@storybook/react-vite'

export default {
  title: 'Staging/NormalTexture',
  component: NormalTexture,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} cameraPosition={new Vector3(0, 0, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof NormalTexture>

type Story = StoryObj<typeof NormalTexture>

function NormalTextureScene(props: React.ComponentProps<typeof NormalTexture>) {
  const { nodes } = useGLTF('suzanne.glb', true) as any

  const normalScale = React.useMemo(
    () => (props.repeat ? new Vector2().fromArray(props.repeat) : undefined),
    [props.repeat]
  )

  return (
    <mesh geometry={(nodes.Suzanne as Mesh).geometry}>
      <NormalTexture {...props}>
        {([normalTexture]) => (
          <meshStandardMaterial
            color="darkmagenta"
            roughness={0.9}
            metalness={0.1}
            normalScale={normalScale}
            normalMap={normalTexture}
          />
        )}
      </NormalTexture>
    </mesh>
  )
}

export const NormalTextureSt = {
  args: {
    id: 3,
    repeat: [4, 4],
    anisotropy: 8,
  },
  render: (args) => <NormalTextureScene {...args} />,
  name: 'Default',
} satisfies Story
