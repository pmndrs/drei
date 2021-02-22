import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Icosahedron, Html } from '../../src'

export default {
  title: 'Misc/Html',
  component: Html,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(-20, 20, -20)}> {storyFn()}</Setup>],
}

function HTMLScene() {
  const ref = useTurntable()
  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html scaleFactor={30} className="html-story-block">
          First
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html scaleFactor={30} className="html-story-block">
          Second
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-10, 0, -10]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html scaleFactor={30} className="html-story-block">
          Third
        </Html>
      </Icosahedron>
    </group>
  )
}

function HTMLTransformScene() {
  const ref = useTurntable()
  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html transform scaleFactor={30}>
          <div className="html-story-block margin300">First</div>
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html transform scaleFactor={30}>
          <div className="html-story-block margin300">Second</div>
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-10, 0, -10]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html sprite transform scaleFactor={30}>
          <div className="html-story-block margin300">Third (sprite)</div>
        </Html>
      </Icosahedron>
    </group>
  )
}

export const HTMLSt = () => <HTMLScene />
HTMLSt.storyName = 'Default'

export const HTMLTransformSt = () => <HTMLTransformScene />
HTMLTransformSt.storyName = 'Transform flag'
