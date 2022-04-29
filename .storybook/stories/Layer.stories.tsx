import * as React from 'react'

import { Setup } from '../Setup'

import { Layer } from '../../src'

export default {
  title: 'Staging/Layer',
  component: Layer,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function LayerScene() {
  return (
    <>
      <Layer layer={2}>
        <mesh position={[0.75, 0.75, 0]}>
          <boxGeometry />
          <meshBasicMaterial color="blue" />
        </mesh>
      </Layer>
      <Layer layer={1}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry />
          <meshBasicMaterial color="green" />
        </mesh>
      </Layer>
      <Layer layer={0}>
        <mesh position={[-0.75, -0.75, 0]}>
          <boxGeometry />
          <meshBasicMaterial color="red" />
        </mesh>
      </Layer>
    </>
  )
}

export const LayerSt = () => <LayerScene />
LayerSt.storyName = 'Default'
