import * as THREE from 'three'
import * as React from 'react'
import { applyProps } from '@react-three/fiber'
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture'

import { Setup } from '../Setup'

import { useGLTF, AccumulativeShadows, RandomizedLight, OrbitControls, Environment } from '../../src'

export default {
  title: 'Staging/AccumulativeShadows',
  component: AccumulativeShadowScene,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function AccumulativeShadowScene() {
  return (
    <React.Suspense fallback={null}>
      <color attach="background" args={['goldenrod']} />
      <Suzi rotation={[-0.63, 0, 0]} scale={2} position={[0, -1.175, 0]} />
      <AccumulativeShadows
        temporal
        frames={100}
        color="goldenrod"
        alphaTest={0.65}
        opacity={2}
        scale={14}
        position={[0, -0.5, 0]}
      >
        <RandomizedLight amount={8} radius={4} ambient={0.5} bias={0.001} position={[5, 5, -10]} />
      </AccumulativeShadows>
      <OrbitControls autoRotate={true} />
      <Environment preset="city" />
    </React.Suspense>
  )
}

function Suzi(props) {
  const { scene, materials } = useGLTF(
    'https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/suzanne-high-poly/model.gltf'
  ) as any
  React.useLayoutEffect(() => {
    scene.traverse((obj) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true))
    applyProps(materials.default, {
      color: 'orange',
      roughness: 0,
      normalMap: new THREE.CanvasTexture(
        new FlakesTexture(),
        THREE.UVMapping,
        THREE.RepeatWrapping,
        THREE.RepeatWrapping
      ),
      'normalMap-flipY': false,
      'normalMap-repeat': [40, 40],
      normalScale: [0.05, 0.05],
    })
  })
  return <primitive object={scene} {...props} />
}

export const AccumulativeShadowSt = () => <AccumulativeShadowScene />
AccumulativeShadowSt.storyName = 'Default'
