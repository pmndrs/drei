import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Icosahedron, TrackballControls } from '../../src'

export default {
  title: 'Controls/TrackballControls',
  component: TrackballControlsScene,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 10)}>{storyFn()}</Setup>],
}

const NUM = 2

interface Positions {
  id: string
  position: [number, number, number]
}

function TrackballControlsScene() {
  const positions = React.useMemo(() => {
    const pos: Positions[] = []
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
          <Icosahedron key={id} args={[1, 1]} position={position}>
            <meshBasicMaterial color="white" wireframe />
          </Icosahedron>
        ))}
      </group>
      <TrackballControls />
    </>
  )
}

export const TrackballControlsSceneSt = () => <TrackballControlsScene />
TrackballControlsSceneSt.story = {
  name: 'Default',
}
