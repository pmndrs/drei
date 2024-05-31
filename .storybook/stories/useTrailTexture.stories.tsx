import * as React from 'react'

import { Setup } from '../Setup'

import { useTrailTexture } from '../../src'

export default {
  title: 'misc/useTrailTexture',
  component: useTrailTexture,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function TrailMesh({ size, radius, maxAge }) {
  // a convenience hook that uses useLoader and TextureLoader
  const [texture, onMove] = useTrailTexture({
    size,
    radius,
    maxAge,
  })

  return (
    <mesh scale={7} onPointerMove={onMove}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function UseTrailTextureScene(args) {
  return (
    <React.Suspense fallback={null}>
      <TrailMesh {...args} />
    </React.Suspense>
  )
}

export const UseTextureSceneSt = (args) => <UseTrailTextureScene {...args} />
UseTextureSceneSt.story = {
  name: 'Default',
}
UseTextureSceneSt.args = {
  size: 256,
  radius: 0.3,
  maxAge: 750,
}
UseTextureSceneSt.argTypes = {
  size: { control: { type: 'range', min: 64, step: 8 } },
  radius: { control: { type: 'range', min: 0.1, max: 1, step: 0.1 } },
  maxAge: { control: { type: 'range', min: 300, max: 1000, step: 100 } },
}
