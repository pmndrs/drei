import * as React from 'react'
import { useFrame } from 'react-three-fiber'
import { Vector3, Mesh } from 'three'

import { Setup } from '../Setup'
import { Reflector, useTexture, TorusKnot, Box } from '../../src'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={20} cameraPosition={new Vector3(-2, 2, 6)}>
        {' '}
        {storyFn()}
      </Setup>
    ),
  ],
}

function ReflectorScene() {
  const roughness = useTexture('roughness_floor.jpeg')
  const normal = useTexture('normal_floor.jpeg')

  const $box = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 25
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <Reflector
        resolution={1024}
        args={[10, 10]}
        mirror={0.75}
        mixBlur={5}
        mixStrength={1}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        blur={[500, 500]}
        minDepthThreshold={0.5}
        maxDepthThreshold={1.5}
        depthScale={2}
        debug={0}
      >
        {(Material, props) => (
          <Material
            color="#a0a0a0"
            metalness={0.5}
            roughnessMap={roughness}
            roughness={1}
            normalMap={normal}
            {...props}
          />
        )}
      </Reflector>

      <Box args={[2, 3, 0.2]} position={[0, 1.6, -3]}>
        <meshPhysicalMaterial color="hotpink" />
      </Box>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <spotLight intensity={1} position={[10, 6, 10]} penumbra={1} angle={0.3} />
    </>
  )
}

export const ReflectorSt = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene />
  </React.Suspense>
)
ReflectorSt.storyName = 'Default'
