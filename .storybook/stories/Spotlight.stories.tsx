import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import { Plane, SpotLight, useDepthBuffer } from '../../src'

export default {
  title: 'Staging/Spotlight',
  component: SpotLight,
  decorators: [withKnobs, (storyFn) => <Setup lights={false}> {storyFn()}</Setup>],
}

function SpotLightScene() {
  const depthBuffer = useDepthBuffer({ size: number('size', 256) })

  return (
    <>
      <SpotLight
        penumbra={0.5}
        depthBuffer={depthBuffer}
        position={[3, 2, 0]}
        intensity={0.5}
        angle={0.5}
        color="#ff005b"
        castShadow
      />
      <SpotLight
        penumbra={0.5}
        depthBuffer={depthBuffer}
        position={[-3, 2, 0]}
        intensity={0.5}
        angle={0.5}
        color="#0EEC82"
        castShadow
      />

      <mesh position-y={0.5} castShadow>
        <boxGeometry />
        <meshPhongMaterial />
      </mesh>

      <Plane receiveShadow rotation-x={-Math.PI / 2} args={[100, 100]}>
        <meshPhongMaterial />
      </Plane>
    </>
  )
}

export const SpotlightSt = () => <SpotLightScene />
SpotlightSt.storyName = 'Default'
