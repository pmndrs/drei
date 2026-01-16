import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'
import { Setup } from '../Setup'
import { SpriteAnimator, useSpriteLoader } from '@react-three/drei'

const SPRITE_IMAGE = 'story.png'
const SPRITE_DATA = 'story.json'
const CYCLOPS_IMAGE = 'cyclops.png'
const CYCLOPS_JSON = 'cyclops.json'

export default {
  title: 'Misc/SpriteAnimator',
  component: SpriteAnimator,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    autoPlay: true,
    loop: true,
    flipX: false,
    startFrame: 0,
    asSprite: false,
    alphaTest: 0.01,
  },
} satisfies Meta<typeof SpriteAnimator>

type Story = StoryObj<typeof SpriteAnimator>

//

function SpriteAnimatorScene1(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, [props.frameName!], null)

  return <SpriteAnimator {...props} spriteDataset={spriteObj} />
}
export const SpriteAnimatorSt1 = {
  args: {
    frameName: 'Fly',
    fps: 18,
    scale: 1.5,
  },
  render: (args) => <SpriteAnimatorScene1 {...args} />,
  name: 'Animated',
} satisfies Story

//

function SpriteAnimatorScene2(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, [props.frameName!], null)

  return <SpriteAnimator {...props} spriteDataset={spriteObj} />
}
export const SpriteAnimatorSt2 = {
  args: {
    frameName: 'sword',
    fps: 0,
  },
  render: (args) => <SpriteAnimatorScene2 {...args} />,
  name: 'Static',
} satisfies Story

//

function SpriteAnimatorScene3(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, ['Fly', 'heart', 'sword', 'skull'], null)

  return (
    <>
      <SpriteAnimator {...props} position={[-2, 0, 0.01]} spriteDataset={spriteObj} frameName={'Fly'} fps={18} />
      <SpriteAnimator {...props} position={[-3, 0, 0.01]} spriteDataset={spriteObj} frameName={'sword'} fps={0} />
      <SpriteAnimator {...props} position={[-1, 0, 0.01]} spriteDataset={spriteObj} frameName={'heart'} fps={0} />
      <SpriteAnimator {...props} position={[0, 0, 0.01]} spriteDataset={spriteObj} frameName={'skull'} fps={0} />
    </>
  )
}

export const SpriteAnimatorSt3 = {
  args: {},
  render: (args) => <SpriteAnimatorScene3 {...args} />,
  name: 'Multiple',
} satisfies Story

function SpriteAnimatorScene4(props: React.ComponentProps<typeof SpriteAnimator>) {
  const commonProps = {
    textureImageURL: CYCLOPS_IMAGE,
    textureDataURL: CYCLOPS_JSON,
    animationNames: ['idle', 'attacking', 'hurt'],
  }

  return (
    <>
      <SpriteAnimator {...props} position={[-2, 0, 0.01]} {...commonProps} fps={18} scale={2.5} frameName={'idle'} />
    </>
  )
}

export const SpriteAnimatorSt4 = {
  args: {},
  render: (args) => <SpriteAnimatorScene4 {...args} />,
  name: 'Image & JSON',
} satisfies Story
