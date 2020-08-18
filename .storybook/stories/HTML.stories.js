import React from 'react'

import { Setup } from '../Setup'

import { Icosahedron } from '../../src/shapes'
import { Html } from '../../src/Html'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Abstractions/Html',
  component: Html,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[-20, 20, -20]}>
        {' '}
        <Story />
      </Setup>
    ),
  ],
}

export function HTMLScene() {
  const ref = useTurntable()
  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]} material-color="hotpink" material-wireframe>
        <Html scaleFactor={30} className="html-story-block">
          First
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]} material-color="hotpink" material-wireframe>
        <Html scaleFactor={30} className="html-story-block">
          Second
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-10, 0, -10]} material-color="hotpink" material-wireframe>
        <Html scaleFactor={30} className="html-story-block">
          Third
        </Html>
      </Icosahedron>
    </group>
  )
}

HTMLScene.storyName = 'Default'
