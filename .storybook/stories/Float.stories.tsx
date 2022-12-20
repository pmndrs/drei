import React, { forwardRef, Suspense, useRef } from 'react'
import * as THREE from 'three'
import { withKnobs, number, array } from '@storybook/addon-knobs'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { Float } from '../../src'

export default {
  title: 'Staging/Float',
  component: Float,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}> {storyFn()}</Setup>],
}

function FloatScene() {
  const cube = useRef()

  return (
    <>
      <Suspense fallback={null}>
        <Float
          position={[0, 1.1, 0]}
          floatingRange={[number('Min Floating Range', undefined), number('Max Floating Range', 1)]}
          rotation={[Math.PI / 3.5, 0, 0]}
          rotationIntensity={number('Rotation Intensity', 4)}
          floatIntensity={number('Float Intensity', 2)}
          speed={number('Speed', 5)}
        >
          <mesh ref={cube}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial wireframe color="white" />
          </mesh>
        </Float>
      </Suspense>

      {/* ground plane */}
      <mesh position={[0, -6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <planeGeometry args={[200, 200, 75, 75]} />
        <meshBasicMaterial wireframe color="red" side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

export const FloatSt = () => <FloatScene />
FloatSt.storyName = 'Default'
