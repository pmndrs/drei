import * as THREE from 'three'
import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { EffectComposer } from '@react-three/postprocessing'

import { Setup } from '../Setup'

import { AutoFocusDOF, AutoFocusDOFProps, Bvh, useGLTF, OrbitControls } from '../../src'

export default {
  title: 'Staging/AutoFocusDOF',
  component: AutoFocusDOF,
  decorators: [
    withKnobs,
    (storyFn) => (
      <Setup
        controls={false}
        gl={{
          powerPreference: 'high-performance',
          alpha: false,
          antialias: false,
          stencil: false,
          depth: false,
        }}
        dpr={1}
        shadows
        camera={{
          fov: 45,
          near: 0.1,
          far: 100,
          position: [80, 4.8, 28],
        }}
      >
        {storyFn()}
      </Setup>
    ),
  ],
}

export const AutoFocusDOFSt = ({ bokehScale, focalLength, focusSpeed, mouseFocus, resolution }: AutoFocusDOFProps) => {
  return (
    <>
      {/* <axesHelper /> */}
      <color attach="background" args={['#b1dbfc']} />
      <fog attach="fog" args={['#f2d830', 35, 60]} />

      <Bvh>
        <Model />
      </Bvh>

      <EffectComposer>
        <AutoFocusDOF bokehScale={8} focalLength={0.08} focusSpeed={0.03} resolution={1024} />
      </EffectComposer>

      <OrbitControls
        autoRotate
        maxPolarAngle={Math.PI / 2.18}
        autoRotateSpeed={0.3}
        maxDistance={33}
        minDistance={8}
        makeDefault
      />
    </>
  )
}
// AutoFocusDOFSt.args = {
//   width: undefined,
//   height: undefined,
//   depth: undefined,
// }

// AutoFocusDOFSt.argTypes = {
//   width: { control: { type: 'boolean' } },
//   height: { control: { type: 'boolean' } },
//   depth: { control: { type: 'boolean' } },
// }

AutoFocusDOFSt.storyName = 'Default'

function Model(props) {
  const { nodes, materials } = useGLTF('i2K9-merged-transformed.glb') as any

  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={1}>
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_1.geometry} material={materials.Grass} />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Floor_Grass_0_2.geometry}
          material={materials['WoodStump.1.001']}
        />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_3.geometry} material={materials.Wood_Stumpf} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_4.geometry} material={materials['WoodStump.1']} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_5.geometry} material={materials['Wood_Stump.2']} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_6.geometry} material={materials['Metal.2']} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_7.geometry} material={materials['Metal.1']} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_8.geometry} material={materials.Bltter} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_9.geometry} material={materials.Tiles_light} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_10.geometry} material={materials.Tiles_dark} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_11.geometry} material={materials.Tiles} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_12.geometry} material={materials.Rope} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_13.geometry} material={materials.Stone_greyish} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_14.geometry} material={materials.Stone_darkish} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_15.geometry} material={materials.Stone_redish} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_16.geometry} material={materials.Bltter_hell} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_17.geometry} material={materials.Bltter_heller} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_18.geometry} material={materials.Stairs} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_19.geometry} material={materials.House} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_20.geometry} material={materials.Roofbox} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_21.geometry} material={materials.Magma} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_22.geometry} material={materials.DarkEarth} />
        <mesh castShadow receiveShadow geometry={nodes.Floor_Grass_0_23.geometry} material={materials.Earth} />
      </group>
    </group>
  )
}
