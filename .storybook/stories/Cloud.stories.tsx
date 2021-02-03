import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Cloud, OrbitControls } from '../../src'
import { boolean, number } from '@storybook/addon-knobs'

export default {
  title: 'Abstractions/Cloud',
  component: Cloud,
  argTypes: {
    opacity: {
      control: {
        type: 'range',
        min: 0,
        max: 1,
        step: 0.1,
      },
    },
    speed: {
      control: {
        type: 'number',
        min: 0,
        step: 0.2,
      },
    },
  },
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function CloudStory({ cfg }) {
  return (
    <>
      <React.Suspense fallback={null}>
        <Cloud
          opacity={cfg.opacity}
          speed={cfg.speed}
          width={cfg.width}
          length={cfg.length}
          segments={cfg.segments}
          dir={cfg.dir}
          position={[-4, -2, 0]}
          args={[3, 2]}
        />
        <Cloud
          opacity={cfg.opacity}
          speed={cfg.speed}
          width={cfg.width}
          length={cfg.length}
          segments={cfg.segments}
          dir={cfg.dir}
          position={[-4, 2, 0]}
          args={[3, 2]}
        />
        <Cloud
          opacity={cfg.opacity}
          speed={cfg.speed}
          width={cfg.width}
          length={cfg.length}
          segments={cfg.segments}
          dir={cfg.dir}
          args={[3, 2]}
        />
        <Cloud
          opacity={cfg.opacity}
          speed={cfg.speed}
          width={cfg.width}
          length={cfg.length}
          segments={cfg.segments}
          dir={cfg.dir}
          position={[4, -2, 0]}
          args={[3, 2]}
        />
        <Cloud
          opacity={cfg.opacity}
          speed={cfg.speed}
          width={cfg.width}
          length={cfg.length}
          segments={cfg.segments}
          dir={cfg.dir}
          position={[4, 2, 0]}
          args={[3, 2]}
        />
      </React.Suspense>
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

const controlsConfig = {
  opacity: 0.5,
  speed: 0.4,
  width: 10,
  length: 1.5,
  segments: 20,
  dir: 1,
}

export const CloudSt = ({ ...args }) => <CloudStory cfg={args} />
CloudSt.storyName = 'Default'
CloudSt.args = { ...controlsConfig }
