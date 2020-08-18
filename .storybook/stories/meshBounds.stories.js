import React, { useState } from 'react'

import { Setup } from '../Setup'
import { meshBounds } from '../../src/meshBounds'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Misc/meshBounds',
  component: MeshBounds,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[0, 0, 5]}>
        <Story />
      </Setup>
    ),
  ],
}
function MeshBounds(props) {
  const mesh = useTurntable()

  const [hovered, setHover] = useState(false)

  return (
    <mesh
      {...props}
      raycast={meshBounds}
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}>
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial attach="material" color="hotpink" wireframe={!hovered} />
    </mesh>
  )
}

export const MeshBoundsSt = () => (
  <>
    <MeshBounds position={[0, 1, 0]} />
    <MeshBounds position={[1, -1, 0]} />
    <MeshBounds position={[-1, -1, 0]} />
  </>
)

MeshBoundsSt.story = {
  name: 'Default',
}
