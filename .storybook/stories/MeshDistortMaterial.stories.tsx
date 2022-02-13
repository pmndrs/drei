import * as React from 'react'
import { useFrame } from '@react-three/fiber'

import { withKnobs, number, optionsKnob } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import { MeshDistortMaterial, Icosahedron } from '../../src'

import {
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshNormalMaterial,
  MeshToonMaterial,
  MeshStandardMaterial,
  MeshPhongMaterial,
  MeshLambertMaterial,
  MeshMatcapMaterial,
  MeshDepthMaterial,
} from 'three'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  decorators: [withKnobs, (storyFn) => <Setup> {storyFn()}</Setup>],
}

function MeshDistortMaterialScene() {
  const options = React.useMemo(
    () => ({
      MeshBasicMaterial,
      MeshPhysicalMaterial,
      MeshNormalMaterial,
      MeshToonMaterial,
      MeshStandardMaterial,
      MeshPhongMaterial,
      MeshLambertMaterial,
      MeshMatcapMaterial,
      MeshDepthMaterial,
    }),
    []
  )
  const base = optionsKnob(
    'Base Material',
    {
      MeshPhysicalMaterial: 'MeshPhysicalMaterial',
      MeshBasicMaterial: 'MeshBasicMaterial',
      MeshMatcapMaterial: 'MeshMatcapMaterial',
      MeshNormalMaterial: 'MeshNormalMaterial',
      MeshStandardMaterial: 'MeshStandardMaterial',
      MeshPhongMaterial: 'MeshPhongMaterial',
      MeshToonMaterial: 'MeshToonMaterial',
      MeshLambertMaterial: 'MeshLambertMaterial',
    },
    'MeshStandardMaterial',
    { display: 'select' }
  )

  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial
        attach="material"
        color="#f25042"
        speed={number('Speed', 1, { range: true, max: 10, step: 0.1 })}
        distort={number('Distort', 0.6, { range: true, min: 0, max: 1, step: 0.1 })}
        radius={number('Radius', 1, { range: true, min: 0, max: 1, step: 0.1 })}
        from={options[base]}
      />
    </Icosahedron>
  )
}

export const MeshDistortMaterialSt = () => <MeshDistortMaterialScene />
MeshDistortMaterialSt.storyName = 'Default'

function MeshDistortMaterialRefScene() {
  const material = React.useRef<JSX.IntrinsicElements['distortMaterialImpl']>(null!)

  useFrame(({ clock }) => {
    material.current.distort = Math.sin(clock.getElapsedTime())
  })

  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial attach="material" color="#f25042" ref={material} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialRefSt = () => <MeshDistortMaterialRefScene />
MeshDistortMaterialRefSt.storyName = 'Ref'
