import React, { forwardRef, Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { Float } from '../../src'
import { float } from 'three/examples/jsm/nodes/Nodes.js'

export default {
  title: 'Staging/Float',
  component: Float,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}> {storyFn()}</Setup>],
}

function FloatScene({ floatingRangeMin, floatingRangeMax, ...args }) {
  const cube = useRef()

  return (
    <>
      <Suspense fallback={null}>
        <Float
          position={[0, 1.1, 0]}
          floatingRange={[floatingRangeMin, floatingRangeMax]}
          rotation={[Math.PI / 3.5, 0, 0]}
          {...args}
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

export const FloatSt = (args) => <FloatScene {...args} />
FloatSt.storyName = 'Default'
FloatSt.args = {
  floatingRangeMin: undefined,
  floatingRangeMax: 1,
  rotationIntensity: 4,
  floatIntensity: 2,
  speed: 5,
}
FloatSt.argTypes = {
  floatingRangeMin: { control: 'number' },
}
