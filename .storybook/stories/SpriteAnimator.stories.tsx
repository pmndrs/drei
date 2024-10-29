import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { SpriteAnimator } from '../../src'
import { useSpriteLoader } from '../../src'

// Assets are loaded from the root public folder
const SPRITE_IMAGE = '/story.png'
const SPRITE_DATA = '/story.json'

export default {
    title: 'Components/SpriteAnimator',
    component: SpriteAnimator,
    decorators: [
        (Story) => (
            <Setup cameraPosition={new Vector3(0, 0, 5)}>
                <Story />
            </Setup>
        ),
    ],
} satisfies Meta<typeof SpriteAnimator>

type Story = StoryObj<typeof SpriteAnimator>

function SpriteScene() {
    const { spriteObj: story } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, ['Fly', 'heart', 'sword', 'skull'], null)

    return (
        <React.Suspense fallback={null}>
            <SpriteAnimator
                position={[-2, 2.8, 0.01]}
                fps={18}
                scale={1.5}
                autoPlay={true}
                loop={true}
                flipX={false}
                startFrame={0}
                spriteDataset={story}
                frameName={'Fly'}
                asSprite={false}
                alphaTest={0.01}
            />

            <SpriteAnimator
                position={[-3, 2.8, 0.01]}
                fps={0}
                scale={1.0}
                autoPlay={true}
                loop={true}
                flipX={false}
                startFrame={0}
                spriteDataset={story}
                frameName={'sword'}
                asSprite={false}
                alphaTest={0.01}
            />

            <SpriteAnimator
                position={[-1, 2.8, 0.01]}
                fps={0}
                scale={1.0}
                autoPlay={true}
                loop={true}
                flipX={false}
                startFrame={0}
                spriteDataset={story}
                frameName={'heart'}
                asSprite={false}
                alphaTest={0.01}
            />

            <SpriteAnimator
                position={[0, 2.8, 0.01]}
                fps={0}
                scale={1.0}
                autoPlay={true}
                loop={true}
                flipX={false}
                startFrame={0}
                spriteDataset={story}
                frameName={'skull'}
                asSprite={false}
                alphaTest={0.01}
            />
        </React.Suspense>
    )
}

export const AllSprites = {
    render: () => <SpriteScene />,
    name: 'All Sprites',
} satisfies Story

export const FlyingSprite = {
    render: () => {
        const { spriteObj: story } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, ['Fly'], null)
        return (
            <SpriteAnimator
                position={[0, 0, 0.01]}
                fps={18}
                scale={1.5}
                autoPlay={true}
                loop={true}
                spriteDataset={story}
                frameName={'Fly'}
                asSprite={false}
                alphaTest={0.01}
            />
        )
    },
    name: 'Flying Animation',
} satisfies Story

export const StaticSprites = {
    render: () => {
        const { spriteObj: story } = useSpriteLoader(SPRITE_IMAGE, SPRITE_DATA, ['heart', 'sword', 'skull'], null)
        return (
            <>
                <SpriteAnimator
                    position={[-1, 0, 0.01]}
                    scale={1.0}
                    spriteDataset={story}
                    frameName={'heart'}
                    asSprite={false}
                    alphaTest={0.01}
                />
                <SpriteAnimator
                    position={[0, 0, 0.01]}
                    scale={1.0}
                    spriteDataset={story}
                    frameName={'sword'}
                    asSprite={false}
                    alphaTest={0.01}
                />
                <SpriteAnimator
                    position={[1, 0, 0.01]}
                    scale={1.0}
                    spriteDataset={story}
                    frameName={'skull'}
                    asSprite={false}
                    alphaTest={0.01}
                />
            </>
        )
    },
    name: 'Static Sprites',
} satisfies Story