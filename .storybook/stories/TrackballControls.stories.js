import React, { useMemo } from 'react'

import { TrackballControls } from '../../src/TrackballControls'
import { setupDecorator } from '../setup-decorator'
import { Icosahedron } from '../../src/shapes'

export default {
  title: 'Controls/TrackballControls',
  component: TrackballControls,
  decorators: [
    setupDecorator(),
  ],
}

const NUM = 2

export function TrackballControlsScene() {
  const positions = useMemo(() => {
    const pos = []
    const half = (NUM - 1) / 2

    for (let x = 0; x < NUM; x++) {
      for (let y = 0; y < NUM; y++) {
        for (let z = 0; z < NUM; z++) {
          pos.push({
            id: `${x}-${y}-${z}`,
            position: [(x - half) * 4, (y - half) * 4, (z - half) * 4],
          })
        }
      }
    }

    return pos
  }, [])

  return (
    <>
      <group>
        {positions.map(({ id, position }) => (
          <Icosahedron key={id} args={[1, 1]} position={position} material-wireframe />
        ))}
      </group>
      <TrackballControls />
    </>
  )
}

TrackballControlsScene.storyName = "Default"
