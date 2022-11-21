import * as React from 'react'
import { withKnobs, number } from '@storybook/addon-knobs'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { Sky, Plane } from '../../src'

export default {
  title: 'Staging/Sky',
  component: Sky,
  decorators: [withKnobs, (storyFn) => <Setup> {storyFn()}</Setup>],
}

function SkyScene() {
  return (
    <>
      <Sky
        turbidity={number('Turbidity', 8, { range: true, max: 10, step: 0.1 })}
        rayleigh={number('Rayleigh', 6, { range: true, max: 10, step: 0.1 })}
        mieCoefficient={number('mieCoefficient', 0.005, { range: true, max: 0.1, step: 0.001 })}
        mieDirectionalG={number('mieDirectionalG', 0.8, { range: true, max: 1, step: 0.01 })}
        sunPosition={[number('Pos X', 0), number('Pos Y', 0), number('Pos Z', 0)]}
      />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt = () => <SkyScene />
SkySt.storyName = 'Default'

function SkyScene2() {
  return (
    <>
      <Sky
        distance={3000}
        turbidity={number('Turbidity', 8, { range: true, max: 10, step: 0.1 })}
        rayleigh={number('Rayleigh', 6, { range: true, max: 10, step: 0.1 })}
        mieCoefficient={number('mieCoefficient', 0.005, { range: true, max: 0.1, step: 0.001 })}
        mieDirectionalG={number('mieDirectionalG', 0.8, { range: true, max: 1, step: 0.01 })}
        inclination={number('Inclination', 0.49, { range: true, max: 1, step: 0.01 })}
        azimuth={number('Azimuth', 0.25, { range: true, max: 1, step: 0.01 })}
      />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt2 = () => <SkyScene2 />
SkySt2.storyName = 'Custom angles'

function SkyScene3() {
  // NOT the right way to do it...
  const [inclination, setInclination] = React.useState(0)
  useFrame(() => {
    setInclination((a) => a + 0.002)
  })

  return (
    <>
      <Sky
        distance={3000}
        turbidity={number('Turbidity', 8, { range: true, max: 10, step: 0.1 })}
        rayleigh={number('Rayleigh', 6, { range: true, max: 10, step: 0.1 })}
        mieCoefficient={number('mieCoefficient', 0.005, { range: true, max: 0.1, step: 0.001 })}
        mieDirectionalG={number('mieDirectionalG', 0.8, { range: true, max: 1, step: 0.01 })}
        inclination={inclination}
        azimuth={number('Azimuth', 0.25, { range: true, max: 1, step: 0.01 })}
      />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt3 = () => <SkyScene3 />
SkySt3.storyName = 'Rotation'
