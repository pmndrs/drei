import * as React from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader, Vector3 } from 'three'

import { Setup } from '../Setup'

import { useAspect, Plane } from '../../src'

export default {
  title: 'Misc/useAspect',
  component: useAspect,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, -10, 0)}>{storyFn()}</Setup>],
}

function Simple() {
  const scale = useAspect(1920, 1080, 1)

  return (
    <Plane scale={scale} rotation-x={Math.PI / 2} args={[1, 1, 4, 4]}>
      <meshPhongMaterial wireframe />
    </Plane>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback="">
    <Simple />
  </React.Suspense>
)
DefaultStory.storyName = 'Default'

function WithTexture() {
  const scale = useAspect('cover', 1920, 1080, 1)

  const map = useLoader(TextureLoader, `https://source.unsplash.com/random/1920x1080`)

  return (
    <Plane scale={scale} rotation-x={Math.PI / 2}>
      <meshPhongMaterial map={map} color="grey" />
    </Plane>
  )
}

export const TextureStory = () => (
  <React.Suspense fallback="">
    <WithTexture />
  </React.Suspense>
)
TextureStory.storyName = 'With Texture'
