import * as React from 'react'
import { useFrame } from 'react-three-fiber'
import { Vector3, Mesh } from 'three'

import { Setup } from '../Setup'

import { Reflector, useTexture, TorusKnot } from '../../src'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(-2, 2, 6)}> {storyFn()}</Setup>],
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
        args={[30, 30]}
        mirror={0.75}
        mixBlur={1}
        mixStrength={2}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        blur={[500, 250]}
        minDepthThreshold={0.5}
        maxDepthThreshold={2}
        depthScale={2}
        debug={0}
      >
        {(Material, props) => (
          <Material color="#777" metalness={0} roughnessMap={roughness} normalMap={normal} {...props} />
        )}
      </Reflector>

      <TorusKnot args={[0.5, 0.2, 128, 32]} position={[-2, 3, -1]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <TorusKnot args={[0.5, 0.2, 128, 32]} position={[2, 1, 1]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <ambientLight intensity={1} />
      <spotLight intensity={1} position={[10, 6, 10]} penumbra={1} angle={0.3} />
      <directionalLight position={[-5, 10, 10]} intensity={1} />
    </>
  )
}

export const ReflectorSt = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene />
  </React.Suspense>
)
ReflectorSt.storyName = 'Default'
