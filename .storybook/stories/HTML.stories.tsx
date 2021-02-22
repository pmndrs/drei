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

function HTMLScene({
  transform = false,
  className = 'html-story-block',
  color = 'hotpink',
  children = null,
}: {
  transform?: boolean
  className?: string
  color?: string
  children?: React.ReactNode
}) {
  const ref = useTurntable()
  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <meshBasicMaterial attach="material" color={color} wireframe />
        <Html transform={transform} scaleFactor={30} className={className}>
          First
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <meshBasicMaterial attach="material" color={color} wireframe />
        <Html transform={transform} scaleFactor={30} className={className}>
          Second
        </Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-10, 0, -10]}>
        <meshBasicMaterial attach="material" color={color} wireframe />
        <Html transform={transform} scaleFactor={30} className={className}>
          Third
        </Html>
      </Icosahedron>
      {children}
    </group>
  )
}

function HTMLTransformScene() {
  return (
    <HTMLScene color="palegreen" transform className="html-story-block margin300">
      <Html
        sprite
        transform
        scaleFactor={50}
        position={[5, 15, 0]}
        style={{ background: 'palegreen', padding: '3px 7px' }}
      >
        Transform mode
      </Html>
    </HTMLScene>
  )
}

export const HTMLSt = () => <HTMLScene />
HTMLSt.storyName = 'Default'

export const HTMLTransformSt = () => <HTMLTransformScene />
HTMLTransformSt.storyName = 'Transform mode'
