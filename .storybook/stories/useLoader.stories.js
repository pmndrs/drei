import { Vector3 } from 'three'
import React, { Suspense } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import ThorAndMidgardSerpent from '../public/scene_draco'
import { Html } from '../../src'
import { Loader } from '../../src/prototyping/Loader'

export default {
  title: 'Prototyping/useLoader',
  component: UseLoader,
}

function ZoomIn() {
  const vec = new Vector3(0, 10, 30)
  return useFrame(({ camera }) => camera.position.lerp(vec, 0.1))
}

function UseLoader() {
  return (
    <>
      <Canvas concurrent camera={{ position: [0, 15, 1000], fov: 70 }}>
        <fog attach="fog" args={[0xfff0ea, 10, 60]} />
        <ambientLight intensity={6} />
        <Suspense
          fallback={
            <Html>
              <Loader />
            </Html>
          }
        >
          <ZoomIn />
          <ThorAndMidgardSerpent />
        </Suspense>
      </Canvas>
    </>
  )
}

export const UseLoaderSt = () => <UseLoader />
UseLoaderSt.story = {
  name: 'Default',
}
