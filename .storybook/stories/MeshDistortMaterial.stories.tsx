import * as React from 'react'
import { useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'
import { MeshDistortMaterial, Icosahedron } from '../../src'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function MeshDistortMaterialScene(args) {
  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial {...args} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialSt = (args) => <MeshDistortMaterialScene {...args} />
MeshDistortMaterialSt.storyName = 'Default'
MeshDistortMaterialSt.args = {
  color: '#f25042',
  speed: 1,
  distort: 0.6,
  radius: 1,
}
MeshDistortMaterialSt.argTypes = {
  color: { control: 'color' },
  speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
  distort: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  radius: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
}

function MeshDistortMaterialRefScene() {
  const material = React.useRef<JSX.IntrinsicElements['distortMaterialImpl']>(null!)

  useFrame(({ clock }) => {
    material.current.distort = Math.sin(clock.getElapsedTime())
  })

  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial color="#f25042" ref={material} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialRefSt = () => <MeshDistortMaterialRefScene />
MeshDistortMaterialRefSt.storyName = 'Ref'
