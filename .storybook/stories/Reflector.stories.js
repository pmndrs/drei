import React, { useRef } from 'react'

import { Box, Plane } from '../../src/shapes'

import { setupDecorator } from '../setup-decorator'
import { MeshWobbleMaterial, Reflector } from '../../src/Reflector'
import { useFrame } from 'react-three-fiber'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [
    setupDecorator({
      controls: true,
      cameraPosition: [6, 6, 6]
    }),
  ],
}

function ReflectorScene() {
  const $box = useRef()
  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 100. 
    $box.current.rotation.y = clock.getElapsedTime() / 2.
  })
  
  return (
    <>  
      <Reflector 
        clipBias={0.1} 
        textureWidth={1024}
        textureHeight={1024}
        rotation={[-Math.PI/2, 0, 0]} 
        color="#333" 
        opacity={.5}
      >
        <planeBufferGeometry args={[10, 10]} attach="geometry" />
      </Reflector>

      <Box position={[-2, 1, -1]} material-color="hotpink" material-wireframe />
      <Box args={[2, 2, 2]} ref={$box} position={[0, 1, 0]} material-color="hotpink" />
      <Box position={[2, 1, 1]} material-color="hotpink" material-wireframe />
    </>
  )
}

export const ReflectorSt = () => <ReflectorScene />
ReflectorSt.storyName = 'Default'
