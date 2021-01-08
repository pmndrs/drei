import * as React from 'react'
import { withKnobs } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Cloud, OrbitControls } from '../../src'

export default {
  title: 'Abstractions/Cloud',
  component: Cloud,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function CloudStory() {
  return (
    <>
      <React.Suspense fallback={null}>
        <Cloud position={[-4, -2, 0]} args={[3, 2]} />
        <Cloud position={[-4, 2, 0]} args={[3, 2]} />
        <Cloud args={[3, 2]} />
        <Cloud position={[4, -2, 0]} args={[3, 2]} />
        <Cloud position={[4, 2, 0]} args={[3, 2]} />
      </React.Suspense>
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const CloudSt = () => <CloudStory />
CloudSt.storyName = 'Default'
