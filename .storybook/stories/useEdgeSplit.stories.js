import React, { Suspense } from 'react'
import { useLoader } from 'react-three-fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import { Setup } from '../Setup'

import { useEdgeSplit } from '../../src/useEdgeSplit'

import { withKnobs, number } from '@storybook/addon-knobs'

export default {
  title: 'Modifiers/useEdgeSplit',
  component: useEdgeSplit,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function CerberusModel() {
  const { children } = useLoader(OBJLoader, 'cerberus.obj')

  const cutoffEdge = number('Cut Off Edge', 20, { range: true, min: 0, max: 180, step: 1 })

  const meshRef = useEdgeSplit(cutoffEdge * (Math.PI / 180))

  return (
    <mesh scale={[8, 8, 8]} ref={meshRef} geometry={children[0].geometry}>
      <meshNormalMaterial />
    </mesh>
  )
}

function UseEdgeSplitScene() {
  return (
    <Suspense fallback={null}>
      <CerberusModel />
    </Suspense>
  )
}

export const UseEdgeSplitSceneSt = () => <UseEdgeSplitScene />
UseEdgeSplitSceneSt.story = {
  name: 'Default',
}
