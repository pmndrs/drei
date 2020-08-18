import React from 'react'

import { Setup } from '../Setup'

import { Detailed } from '../../src/Detailed'
import { Icosahedron } from '../../src/shapes'

export default {
  title: 'Abstractions/Detailed',
  component: Detailed,
  decorators: [
    (Story) => (
      <Setup camera={{ near: 1, far: 1100, fov: 75 }} controls={false}>
        <Story />
      </Setup>
    ),
  ],
}

export function DetailedScene() {
  return (
    <>
      <Detailed distances={[0, 50, 150]}>
        <Icosahedron args={[10, 3]} material-color="hotpink" material-wireframe />
        <Icosahedron args={[10, 2]} material-color="lightgreen" material-wireframe />
        <Icosahedron args={[10, 1]} material-color="lightblue" material-wireframe />
      </Detailed>
    </>
  )
}

DetailedScene.storyName = 'Default'
