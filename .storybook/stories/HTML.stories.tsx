import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Icosahedron, Html } from '../../src'
import { HtmlProps, calculatePositionFunction } from 'web/Html'

export default {
  title: 'Misc/Html',
  component: Html,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(-20, 20, -20)}> {storyFn()}</Setup>],
}

function HTMLScene(htmlProps: HtmlProps) {
  const ref = useTurntable()
  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html {...htmlProps}>First</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html {...htmlProps}>Second</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-20, 0, -20]}>
        <meshBasicMaterial attach="material" color="hotpink" wireframe />
        <Html {...htmlProps}>Third</Html>
      </Icosahedron>
    </group>
  )
}

export const HTMLSt = () => <HTMLScene scaleFactor={30} className="html-story-block" />
HTMLSt.storyName = 'Default'

const v1 = new THREE.Vector3()
const overrideCalculatePosition: calculatePositionFunction = (el, camera, size) => {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [
    Math.min(size.width - 100, Math.max(0, objectPos.x * widthHalf + widthHalf)),
    Math.min(size.height - 20, Math.max(0, -(objectPos.y * heightHalf) + heightHalf)),
  ]
}

export const HTMLCalculatePosition = () => (
  <HTMLScene className="html-story-label" calculatePosition={overrideCalculatePosition} />
)
HTMLCalculatePosition.storyName = 'Custom Calculate Position'
