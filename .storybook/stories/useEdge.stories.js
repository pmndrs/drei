import React, { Suspense } from 'react'

import { Setup } from '../Setup'

import { useEdge } from '../../src/useEdge'
import { useGLTF } from '../../src/useGLTF'

import { withKnobs, number } from '@storybook/addon-knobs'

export default {
  title: 'Modifiers/useEdge',
  component: useEdge,
  decorators: [withKnobs, (storyFn) => <Setup>{storyFn()}</Setup>],
}

function SuzanneModel() {
    const { nodes, materials } = useGLTF('suzanne.glb', true)

    const cutoffEdge = number('Cut Off Edge', 20, {range: true, min: 0, max: 180, step: 1})
    
    const meshRef = useEdge(cutoffEdge * Math.PI / 180)
  
    return <mesh ref={meshRef} material={materials['Material.001']} geometry={nodes.Suzanne.geometry} />
  }

function UseEdgeScene() {
  return (
    <Suspense fallback={null}>
      <SuzanneModel />
    </Suspense>
  )
}

export const UseEdgeSceneSt = () => <UseEdgeScene />
UseEdgeSceneSt.story = {
  name: 'Default',
}
