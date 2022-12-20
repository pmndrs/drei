import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { useTrailTexture } from '../../src'

export default {
  title: 'misc/useTrailTexture',
  component: useTrailTexture,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function TrailMesh() {
  // a convenience hook that uses useLoader and TextureLoader
  const [texture, onMove] = useTrailTexture({
    size: number('Size', 256, { min: 64, step: 8 }),
    radius: number('Radius', 0.3, { range: true, min: 0.1, max: 1, step: 0.1 }),
    maxAge: number('Max age', 750, { range: true, min: 300, max: 1000, step: 100 }),
  })

  return (
    <mesh scale={7} onPointerMove={onMove}>
      <planeGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  )
}

function UseTrailTextureScene() {
  return (
    <React.Suspense fallback={null}>
      <TrailMesh />
    </React.Suspense>
  )
}

export const UseTextureSceneSt = () => <UseTrailTextureScene />
UseTextureSceneSt.story = {
  name: 'Default',
}
