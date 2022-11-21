import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'
import { OrbitControls, PositionalAudio } from '../../src'

export default {
  title: 'Abstractions/PositionalAudio',
  component: PositionalAudioScene,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 20)}>{storyFn()}</Setup>],
}

function PositionalAudioScene() {
  const args = React.useMemo(
    () => [
      {
        position: new Vector3(10, 0, 10),
        url: 'sounds/1.mp3',
      },
      {
        position: new Vector3(-10, 0, 10),
        url: 'sounds/2.mp3',
      },
      {
        position: new Vector3(10, 0, -10),
        url: 'sounds/3.mp3',
      },
      {
        position: new Vector3(-10, 0, -10),
        url: 'sounds/4.mp3',
      },
    ],
    []
  )

  return (
    <>
      <React.Suspense fallback={null}>
        <group position={[0, 0, 5]}>
          {args.map(({ position, url }, index) => (
            <mesh key={`0${index}`} position={position}>
              <sphereGeometry />
              <meshBasicMaterial wireframe color="hotpink" />
              <PositionalAudio url={url} />
            </mesh>
          ))}
        </group>
      </React.Suspense>
      <OrbitControls />
    </>
  )
}

export const PositionalAudioSceneSt = () => <PositionalAudioScene />
PositionalAudioSceneSt.story = {
  name: 'Default',
}
