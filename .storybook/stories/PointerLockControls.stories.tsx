import * as React from 'react'

import { Setup } from '../Setup'

import { PointerLockControls, Icosahedron } from '../../src'

export default {
  title: 'Controls/PointerLockControls',
  component: PointerLockControlsScene,
}

const NUM = 2

interface Positions {
  id: string
  position: [number, number, number]
}

function Icosahedrons() {
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
    <group>
      {positions.map(({ id, position }) => (
        <Icosahedron key={id} args={[1, 1]} position={position}>
          <meshBasicMaterial color="white" wireframe />
        </Icosahedron>
      ))}
    </group>
  )
}

function PointerLockControlsScene() {
  return (
    <>
      <Setup controls={false} camera={{ position: [0, 0, 10] }}>
        <Icosahedrons />
        <PointerLockControls />
      </Setup>
    </>
  )
}

export const PointerLockControlsSceneSt = () => <PointerLockControlsScene />
PointerLockControlsSceneSt.story = {
  name: 'Default',
}

function PointerLockControlsSceneWithSelector() {
  return (
    <>
      <div
        id="instructions"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '2em',
          background: 'white',
        }}
      >
        Click here to play
      </div>
      <Setup controls={false} camera={{ position: [0, 0, 10] }}>
        <Icosahedrons />
        <PointerLockControls selector="#instructions" />
      </Setup>
      <div
        id="instructions"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '2em',
          background: 'white',
        }}
      >
        Click here to play
      </div>
    </>
  )
}

export const PointerLockControlsSceneStWithSelector = () => <PointerLockControlsSceneWithSelector />
PointerLockControlsSceneStWithSelector.story = {
  name: 'With selector',
}
