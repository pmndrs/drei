import React, { useMemo } from 'react'

import { Setup } from '../Setup'

import { Icosahedron } from '../../src/shapes'
import { PerspectiveCamera } from '../../src/PerspectiveCamera'

export default {
  title: 'Camera/PerspectiveCamera',
  component: PerspectiveCamera,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
}

const NUM = 3

export function PerspectiveCameraScene() {
  const positions = useMemo(() => {
    const pos = []
    const half = (NUM - 1) / 2

    for (let x = 0; x < NUM; x++) {
      for (let y = 0; y < NUM; y++) {
        pos.push({
          id: `${x}-${y}`,
          position: [(x - half) * 4, (y - half) * 4, 0],
        })
      }
    }

    return pos
  }, [])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <group position={[0, 0, -10]}>
        {positions.map(({ id, position }) => (
          <Icosahedron key={id} position={position} args={[1, 1]}>
            <meshBasicMaterial attach="material" color="white" wireframe />
          </Icosahedron>
        ))}
      </group>
    </>
  )
}

PerspectiveCameraScene.story = {
  name: 'Default',
}
