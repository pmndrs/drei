import React from 'react'

import { setupDecorator } from '../setup-decorator'
import { MeshWobbleMaterial, Reflector } from '../../src/Reflector'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [
    setupDecorator(),
  ],
}

function ReflectorScene() {
  return (
    <>
      <Reflector>
        <planeBufferGeometry args={[2, 5]} attach="geometry" />
      </Reflector>
      <mesh position={[0, -2, 2]}>
        <boxBufferGeometry attach="geometry" />
        <meshBasicMaterial attach="material" color="red" opacity={1} transparent />
      </mesh>
    </>
  )
}

export const ReflectorSt = () => <ReflectorScene />
ReflectorSt.storyName = 'Default'
