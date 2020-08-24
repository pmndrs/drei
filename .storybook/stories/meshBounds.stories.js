import React, { useState } from 'react'

import { setupDecorator } from '../setup-decorator'
import { meshBounds } from '../../src/meshBounds'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Misc/meshBounds',
  component: MeshBounds,
  decorators: [
    setupDecorator(),
  ],
}
function MeshBounds(props) {
  const mesh = useTurntable()

  const [hovered, setHover] = useState(false)

  return (
    <Box
      {...props}
      raycast={meshBounds}
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      material-color="hotpink" material-wireframe={!hovered}
    />
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
