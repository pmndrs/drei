import * as React from 'react'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'
import { MeshWobbleMaterial, Torus } from '../../src'

export default {
  title: 'Shaders/MeshWobbleMaterial',
  component: MeshWobbleMaterial,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function MeshWobbleMaterialScene(args) {
  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial {...args} />
    </Torus>
  )
}

export const MeshWobbleMaterialSt = (args) => <MeshWobbleMaterialScene {...args} />
MeshWobbleMaterialSt.storyName = 'Default'
MeshWobbleMaterialSt.args = {
  color: '#f25042',
  speed: 1,
  factor: 0.6,
}
MeshWobbleMaterialSt.argTypes = {
  color: { control: 'color' },
  speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  factor: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
}

function MeshWobbleMaterialRefScene(args) {
  const material = React.useRef<JSX.IntrinsicElements['wobbleMaterialImpl']>(null!)

  useFrame(({ clock }) => {
    material.current.factor = Math.abs(Math.sin(clock.getElapsedTime())) * 2
    material.current.speed = Math.abs(Math.sin(clock.getElapsedTime())) * 10
  })

  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial {...args} color="#f25042" ref={material} />
    </Torus>
  )
}

export const MeshWobbleMaterialRefSt = (args) => <MeshWobbleMaterialRefScene {...args} />
MeshWobbleMaterialRefSt.storyName = 'Ref'
MeshWobbleMaterialRefSt.args = {}
