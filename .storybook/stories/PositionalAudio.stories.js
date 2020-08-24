import React, { Suspense } from 'react'

import { Sphere } from '../../src/shapes'

import { setupDecorator } from '../setup-decorator'
import { OrbitControls } from '../../src/OrbitControls'
import { PositionalAudio } from '../../src/PositionalAudio'

export default {
  title: 'Abstractions/PositionalAudio',
  component: PositionalAudioScene,
  decorators: [
    setupDecorator(),
  ],
}

function PositionalAudioScene() {
  const args = [
    {
      position: [10, 0, 10],
      url: 'sounds/1.mp3',
    },
    {
      position: [-10, 0, 10],
      url: 'sounds/2.mp3',
    },
    {
      position: [10, 0, -10],
      url: 'sounds/3.mp3',
    },
    {
      position: [-10, 0, -10],
      url: 'sounds/4.mp3',
    },
  ]

  return (
    <>
      <Suspense fallback={null}>
        <group position={[0, 0, 5]}>
          {args.map(({ position, url }, index) => (
            <Sphere key={`0${index}`} position={position} material-color="hotpink" material-wireframe>
              <PositionalAudio url={url} />
            </Sphere>
          ))}
        </group>
      </Suspense>
      <OrbitControls />
    </>
  )
}

export const PositionalAudioSceneSt = () => <PositionalAudioScene />
PositionalAudioSceneSt.story = {
  name: 'Default',
}
