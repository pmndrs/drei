import * as React from 'react'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { Sky, Plane } from '../../src'
import { distance } from 'maath/dist/declarations/src/vector2'

export default {
  title: 'Staging/Sky',
  component: Sky,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function SkyScene(args) {
  return (
    <>
      <Sky {...args} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt = (args) => <SkyScene {...args} />
SkySt.storyName = 'Default'
SkySt.args = {
  turbidity: 8,
  rayleigh: 6,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  sunPosition: [1, 0, 0],
}
SkySt.argTypes = {
  turbidity: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  rayleigh: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  mieCoefficient: { control: { type: 'range', min: 0, max: 0.1, step: 0.001 } },
  mieDirectionalG: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
}

function SkyScene2(args) {
  return (
    <>
      <Sky {...args} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt2 = (args) => <SkyScene2 {...args} />
SkySt2.storyName = 'Custom angles'
SkySt2.args = {
  distance: 3000,
  turbidity: 8,
  rayleigh: 6,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  inclination: 0.49,
  azimuth: 0.25,
}
SkySt2.argTypes = {
  turbidity: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  rayleigh: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  mieCoefficient: { control: { type: 'range', min: 0, max: 0.1, step: 0.001 } },
  mieDirectionalG: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  inclination: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  azimuth: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
}

function SkyScene3(args) {
  // NOT the right way to do it...
  const [inclination, setInclination] = React.useState(0)
  useFrame(() => {
    setInclination((a) => a + 0.002)
  })

  return (
    <>
      <Sky {...args} />
      <Plane rotation-x={Math.PI / 2} args={[100, 100, 4, 4]}>
        <meshBasicMaterial color="black" wireframe />
      </Plane>
      <axesHelper />
    </>
  )
}

export const SkySt3 = (args) => <SkyScene3 {...args} />
SkySt3.storyName = 'Rotation'
SkySt3.args = {
  distance: 3000,
  turbidity: 8,
  rayleigh: 6,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  inclination: 0.49,
  azimuth: 0.25,
}
SkySt3.argTypes = {
  turbidity: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  rayleigh: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  mieCoefficient: { control: { type: 'range', min: 0, max: 0.1, step: 0.001 } },
  mieDirectionalG: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  inclination: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  azimuth: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
}
