import * as React from 'react'
import { Canvas } from '@react-three/fiber'

import { Icosahedron, PerspectiveCamera, OrbitControls } from '../../src'

export default {
  title: 'Camera/PerspectiveCamera',
  component: PerspectiveCameraScene,
}

const NUM = 3

interface Positions {
  id: string
  position: [number, number, number]
}

function PerspectiveCameraScene() {
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
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <group position={[0, 0, -10]}>
        {positions.map(({ id, position }) => (
          <Icosahedron key={id} position={position} args={[1, 1]}>
            <meshBasicMaterial color="white" wireframe />
          </Icosahedron>
        ))}
      </group>
      <OrbitControls />
    </Canvas>
  )
}

export const PerspectiveCameraSceneSt = () => <PerspectiveCameraScene />
PerspectiveCameraSceneSt.story = {
  name: 'Default',
}
