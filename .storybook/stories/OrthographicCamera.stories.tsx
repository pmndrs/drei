import * as React from 'react'
import { Canvas } from '@react-three/fiber'

import { Icosahedron, OrthographicCamera, OrbitControls, useHelper } from '../../src'

export default {
  title: 'Camera/OrthographicCamera',
  component: OrthographicCameraScene,
  args: {
    showHelper: false,
  },
  argTypes: {
    showHelper: {
      type: 'boolean',
    },
  },
}

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function OrthographicCameraScene({ showHelper }: { showHelper: boolean }) {
  const positions = React.useMemo(() => {
    const pos: Positions[] = []
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
    <Canvas>
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={40} helper={showHelper} />
      <group position={[0, 0, -10]}>
        {positions.map(({ id, position }) => (
          <Icosahedron key={id} position={position} args={[1, 1]}>
            <meshBasicMaterial attach="material" color="white" wireframe />
          </Icosahedron>
        ))}
      </group>
      <OrbitControls />
    </Canvas>
  )
}

export const OrthographicCameraSceneSt = (args: { showHelper: boolean }) => <OrthographicCameraScene {...args} />
OrthographicCameraSceneSt.story = {
  name: 'Default',
}
