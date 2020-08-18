import React, { useMemo } from 'react'

import { setupDecorator } from '../setup-decorator'

import { Icosahedron } from '../../src/shapes'
import { OrthographicCamera } from '../../src/OrthographicCamera'

export default {
  title: 'Camera/OrthographicCamera',
  component: OrthographicCamera,
  decorators: [ setupDecorator() ],
}

const NUM = 3

export function OrthographicCameraScene() {
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
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={40} />
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

OrthographicCameraScene.storyName = 'Defaut'
