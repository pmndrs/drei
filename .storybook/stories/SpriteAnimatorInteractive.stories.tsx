import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '../../src'
import { SpriteAnimator, useSpriteLoader } from '../../src'

// Helper component for consistent setup
const Setup = ({ children, cameraPosition = new Vector3(0, 0, 10) }) => (
  <Canvas>
    <PerspectiveCamera makeDefault position={cameraPosition.toArray()} fov={50} />
    <ambientLight />
    <pointLight position={[10, 10, 10]} />
    <OrbitControls />
    {children}
  </Canvas>
)

const STORY_IMAGE = 'story.png'
const STORY_JSON = 'story.json'
const STATICS_IMAGE = 'statics.png'
const STATICS_JSON = 'statics.json'
const KNIGHT_IMAGE = 'knight.png'
const KNIGHT_JSON = 'knight.json'
const CYCLOPS_IMAGE = 'cyclops.png'
const CYCLOPS_JSON = 'cyclops.json'
const EXPLODE_IMAGE = 'explode.png'
const EXPLODE_JSON = 'explode.json'
const FLAMEUP_IMAGE = 'flameup.png'
const FLAMEUP_JSON = 'flameup.json'
const ALIEN = 'alien.png'

export default {
  title: 'Components/SpriteAnimator',
  component: SpriteAnimator,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)}>
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

// Basic static sprites story
function StaticSpritesScene(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj: statics } = useSpriteLoader(STATICS_IMAGE, STATICS_JSON, null, null)

  return (
    <>
      <SpriteAnimator position={[-2, 0, 0.01]} fps={0} scale={0.5} spriteDataset={statics} asSprite={true} {...props} />
      <SpriteAnimator position={[0, 0, 0.01]} fps={0} scale={0.5} spriteDataset={statics} asSprite={false} {...props} />
    </>
  )
}

export const StaticSprites = {
  render: (args) => <StaticSpritesScene {...args} />,
  name: 'Static Sprites',
} satisfies Story

// Multiple animated sprites story
function AnimatedSpritesScene(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj: story } = useSpriteLoader(STORY_IMAGE, STORY_JSON, ['Fly', 'heart', 'sword', 'skull'], null)

  return (
    <>
      <SpriteAnimator
        position={[-2, 0, 0.01]}
        fps={18}
        scale={1.5}
        spriteDataset={story}
        frameName={'Fly'}
        {...props}
      />
      <SpriteAnimator
        position={[-1, 0, 0.01]}
        fps={0}
        scale={1.0}
        spriteDataset={story}
        frameName={'sword'}
        {...props}
      />
      <SpriteAnimator
        position={[0, 0, 0.01]}
        fps={0}
        scale={1.0}
        spriteDataset={story}
        frameName={'heart'}
        {...props}
      />
      <SpriteAnimator
        position={[1, 0, 0.01]}
        fps={0}
        scale={1.0}
        spriteDataset={story}
        frameName={'skull'}
        {...props}
      />
    </>
  )
}

export const AnimatedSprites = {
  render: (args) => <AnimatedSpritesScene {...args} />,
  name: 'Multiple Animated Sprites',
} satisfies Story

// Interactive battle scene story
function BattleScene(props: React.ComponentProps<typeof SpriteAnimator>) {
  const [knightState, setKnightState] = React.useState('idle')
  const [cyclopsState, setCyclopsState] = React.useState('idle')
  const [hit, setHit] = React.useState(false)
  const [ogreHit, setOgreHit] = React.useState(false)

  const onKnightAttack = () => setKnightState('attacking')
  const onCyclopsAttack = () => setCyclopsState('attacking')

  const onKnightEnd = () => knightState !== 'idle' && setKnightState('idle')
  const onCyclopsEnd = () => cyclopsState !== 'idle' && setCyclopsState('idle')

  const onKnightFrame = ({ currentFrame }: { currentFrame: number }) => {
    if (currentFrame === 8 && knightState === 'attacking') {
      setCyclopsState('hurt')
      setHit(true)
    }
  }

  const onCyclopsFrame = ({ currentFrame }: { currentFrame: number }) => {
    if (currentFrame === 8 && cyclopsState === 'attacking') {
      setKnightState('hurt')
      setOgreHit(true)
    }
  }

  return (
    <>
      <SpriteAnimator
        position={[-1, 0, 0.01]}
        fps={18}
        scale={2.5}
        frameName={cyclopsState}
        onClick={onCyclopsAttack}
        onFrame={onCyclopsFrame}
        onLoopEnd={onCyclopsEnd}
        animationNames={['idle', 'attacking', 'hurt']}
        textureImageURL={CYCLOPS_IMAGE}
        textureDataURL={CYCLOPS_JSON}
        {...props}
      />
      <SpriteAnimator
        position={[1, 0, 0.01]}
        fps={18}
        scale={2}
        flipX={true}
        frameName={knightState}
        onClick={onKnightAttack}
        onFrame={onKnightFrame}
        onLoopEnd={onKnightEnd}
        animationNames={['idle', 'attacking', 'hurt']}
        textureImageURL={KNIGHT_IMAGE}
        textureDataURL={KNIGHT_JSON}
        {...props}
      />
      {hit && (
        <SpriteAnimator
          position={[-1, 2, -1.5]}
          fps={24}
          scale={2.5}
          autoPlay
          resetOnEnd
          loop={false}
          onEnd={() => setHit(false)}
          frameName="burn_effect"
          textureImageURL={FLAMEUP_IMAGE}
          textureDataURL={FLAMEUP_JSON}
          {...props}
        />
      )}
      {ogreHit && (
        <SpriteAnimator
          position={[1.45, 1.5, -1.5]}
          fps={18}
          scale={2.5}
          autoPlay
          resetOnEnd
          loop={false}
          onEnd={() => setOgreHit(false)}
          textureImageURL={EXPLODE_IMAGE}
          textureDataURL={EXPLODE_JSON}
          {...props}
        />
      )}
    </>
  )
}

export const InteractiveBattle = {
  args: {
    autoPlay: true,
    loop: true,
    alphaTest: 0.01,
  },
  render: (args) => <BattleScene {...args} />,
  name: 'Interactive Battle Scene',
  parameters: {
    docs: {
      description: {
        story: 'Click on the characters to trigger their attack animations.',
      },
    },
  },
} satisfies Story

// Simple spritesheet animation
function AlienScene(props: React.ComponentProps<typeof SpriteAnimator>) {
  const { spriteObj: alien } = useSpriteLoader(ALIEN, null, null, 16)

  return <SpriteAnimator position={[0, 0, 0]} scale={2} numberOfFrames={16} spriteDataset={alien} {...props} />
}

export const SimpleSpritesheet = {
  render: (args) => <AlienScene {...args} />,
  name: 'SpriteAnimator interactive',
} satisfies Story
