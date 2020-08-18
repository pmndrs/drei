import React, { Suspense } from 'react'
import { useLoader } from 'react-three-fiber'
import { useAspect } from '../../src/useAspect'

import { Plane } from '../../src/shapes'

import { setupDecorator } from '../setup-decorator'
import { TextureLoader } from 'three'

export default {
  title: 'Misc/useAspect',
  component: useAspect,
  decorators: [
    setupDecorator(),
  ],
}

function Simple() {
  const scale = useAspect('cover', 1920, 1080, 1)

  return <Plane scale={scale} rotation-x={Math.PI / 2} args={[1, 1, 4, 4]} material-wireframe />
}

export const DefaultStory = () => (
  <Suspense fallback="">
    <Simple />
  </Suspense>
)
DefaultStory.storyName = 'Default'

function WithTexture() {
  const scale = useAspect('cover', 1920, 1080, 1)

  const [map] = useLoader(TextureLoader, [`https://source.unsplash.com/random/1920x1080`])

  return <Plane scale={scale} rotation-x={Math.PI / 2} material-map={map} />
}

export const TextureStory = () => (
  <Suspense fallback="">
    <WithTexture />
  </Suspense>
)
TextureStory.storyName = 'With Texture'
