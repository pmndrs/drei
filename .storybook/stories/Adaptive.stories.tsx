import React, { Suspense } from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { useGLTF, AdaptiveDpr, AdaptiveEvents, OrbitControls } from '../../src'

import type { Material, Mesh } from 'three'
import type { GLTF } from 'three-stdlib'

export default {
  title: 'Performance/Adaptive',
  component: useGLTF,
  decorators: [
    (storyFn) => (
      <Setup
        cameraPosition={new Vector3(0, 0, 30)}
        cameraFov={50}
        shadows
        controls={false}
        lights={false}
        performance={{ min: 0.2 }}
      >
        {storyFn()}
      </Setup>
    ),
  ],
}

interface ArcherGLTF extends GLTF {
  materials: { material_0: Material }
  nodes: Record<'mesh_0' | 'mesh_1' | 'mesh_2', Mesh>
}

function Archer() {
  const {
    nodes: { mesh_0, mesh_1, mesh_2 },
    materials: { material_0 },
  } = useGLTF('/archer.glb') as ArcherGLTF

  return (
    <group dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <group position={[0, 0, 2]}>
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_0.geometry} />
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_1.geometry} />
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_2.geometry} />
        </group>
      </group>
    </group>
  )
}

function AdaptiveScene() {
  return (
    <>
      <Suspense fallback={null}>
        <Archer />
      </Suspense>
      <directionalLight
        intensity={0.2}
        position={[10, 10, 5]}
        shadow-mapSize-width={64}
        shadow-mapSize-height={64}
        castShadow
        shadow-bias={-0.001}
      />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <OrbitControls regress />
    </>
  )
}

export const AdaptiveSceneSt = () => <AdaptiveScene />
AdaptiveSceneSt.story = {
  name: 'Default',
}
