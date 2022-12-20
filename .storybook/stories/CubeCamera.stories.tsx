import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { Box, CubeCamera } from '../../src'

export default {
  title: 'Camera/CubeCamera',
  component: CubeCamera,
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
  useFrame(({ clock }) => {
    ref.current!.position.y = Math.sin(offset + clock.elapsedTime) * 5
  })

  return (
    <CubeCamera {...props}>
      {(texture) => (
        <mesh ref={ref}>
          <sphereGeometry args={[5, 64, 64]} />
          <meshStandardMaterial roughness={0} metalness={1} envMap={texture} />
        </mesh>
      )}
    </CubeCamera>
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
