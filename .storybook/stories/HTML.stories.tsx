import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'
import { useFadeInOut } from '../useFadeInOut'

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
  const ref = useFadeInOut()

  const initialCamera = {
    position: new THREE.Vector3(0, 0, -10),
    fov: 40,
  }

  return (
    <>
      <OrthographicCamera makeDefault={true} applyMatrix4={undefined} {...initialCamera} />

      <Icosahedron args={[200, 5]} position={[100, 0, 0]} ref={ref}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html scaleFactor={250} className="html-story-block">
          Orthographic Scaling
        </Html>
      </Icosahedron>
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
    </>
  )
}

export const HTMLOrthoSt = () => <HTMLOrthographicScene />
HTMLOrthoSt.storyName = 'Orthographic'
