import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Icosahedron, Html, OrthographicCamera } from '../../src'

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

export const HTMLSt = () => <HTMLScene />
HTMLSt.storyName = 'Default'

function HTMLOrthographicScene() {
  const ref = useTurntable()

  const initialCamera = {
    position: new THREE.Vector3(0, 0, 1500),
    fov: 40,
    far: 20000,
    near: 10,
    up: new THREE.Vector3(0, 0, 1),
  }

  return (
    <>
      <OrthographicCamera makeDefault={true} applyMatrix4={undefined} {...initialCamera}>
        <></>
      </OrthographicCamera>
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
    </>
  )
}

export const HTMLOrthoSt = () => <HTMLOrthographicScene />
HTMLOrthoSt.storyName = 'Orthographic'
