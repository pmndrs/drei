import * as React from 'react'
import { Color, Group, Vector3 } from 'three'

import { Setup } from '../Setup'

import { MarchingCube, MarchingCubes, MarchingPlane, OrbitControls } from '../../src'
import { useFrame } from '@react-three/fiber'

export default {
  title: 'Abstractions/MarchingCubes',
  component: MarchingCubes,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

const MarchingCubesScene = ({ resolution, maxPolyCount, planeX, planeY, planeZ }) => {
  const cubeRefOne = React.useRef<Group>()
  const cubeRefTwo = React.useRef<Group>()

  useFrame(({ clock }) => {
    if (!cubeRefOne.current || !cubeRefTwo.current) return
    const time = clock.getElapsedTime()
    cubeRefOne.current.position.set(0.5, Math.sin(time * 0.4) * 0.5 + 0.5, 0.5)
    cubeRefTwo.current.position.set(0.5, Math.cos(time * 0.4) * 0.5 + 0.5, 0.5)
  })

  return (
    <MarchingCubes resolution={resolution} maxPolyCount={maxPolyCount} enableColors={true} scale={2}>
      <MarchingCube ref={cubeRefOne} color={new Color('#f0f')} position={[0.5, 0.6, 0.5]} />
      <MarchingCube ref={cubeRefTwo} color={new Color('#ff0')} position={[0.5, 0.5, 0.5]} />

      {planeX && <MarchingPlane planeType="x" />}
      {planeY && <MarchingPlane planeType="y" />}
      {planeZ && <MarchingPlane planeType="z" />}

      <meshPhongMaterial specular={0xffffff} shininess={2} vertexColors={true} />
    </MarchingCubes>
  )
}

export const MarchingCubesStory = ({ resolution, maxPolyCount, planeX, planeY, planeZ }) => {
  return (
    <>
      <MarchingCubesScene
        resolution={resolution}
        maxPolyCount={maxPolyCount}
        planeX={planeX}
        planeY={planeY}
        planeZ={planeZ}
      />
      <axesHelper />
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

MarchingCubesStory.args = {
  resolution: 40,
  maxPolyCount: 40000,
  planeX: false,
  planeY: true,
  planeZ: false,
}

MarchingCubesStory.storyName = 'Default'
