import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { useCubeCamera, Box } from '../../src'

export default {
  title: 'misc/useCubeCamera',
  component: useCubeCamera,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 10, 40)}>{storyFn()}</Setup>],
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      axisHelper: object
    }
  }
}

function Sphere({ offset = 0, ...props }) {
  const ref = React.useRef<THREE.Group>()

  const { fbo, camera, update } = useCubeCamera()

  useFrame(({ clock }) => {
    ref.current!.position.y = Math.sin(offset + clock.elapsedTime) * 5

    ref.current!.visible = false
    update()
    ref.current!.visible = true
  })

  return (
    <group {...props}>
      <primitive object={camera} />
      <mesh ref={ref}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial roughness={0} metalness={1} envMap={fbo.texture} />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={['#f0f0f0', 100, 200]} />

      <Sphere position={[-10, 10, 0]} />
      <Sphere position={[10, 9, 0]} offset={2000} />

      <Box material-color="hotpink" args={[5, 5, 5]} position-y={2.5} />

      <gridHelper args={[100, 10]} />
    </>
  )
}

export const DefaultStory = () => <Scene />
DefaultStory.storyName = 'Default'
