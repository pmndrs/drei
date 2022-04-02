import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Detailed, Icosahedron, OrbitControls } from '../../src'

export default {
  title: 'Abstractions/Detailed',
  component: Detailed,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 100)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function DetailedScene() {
  return (
    <>
      <Detailed distances={[0, 50, 150]}>
        <Icosahedron args={[10, 3]}>
          <meshBasicMaterial color="hotpink" wireframe />
        </Icosahedron>
        <Icosahedron args={[10, 2]}>
          <meshBasicMaterial color="lightgreen" wireframe />
        </Icosahedron>
        <Icosahedron args={[10, 1]}>
          <meshBasicMaterial color="lightblue" wireframe />
        </Icosahedron>
      </Detailed>
      <OrbitControls enablePan={false} enableRotate={false} zoomSpeed={0.5} />
    </>
  )
}

export const DetailedSt = () => <DetailedScene />
DetailedSt.storyName = 'Default'
