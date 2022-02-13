import * as React from 'react'
import { useFrame } from '@react-three/fiber'
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

import { withKnobs, number, optionsKnob } from '@storybook/addon-knobs'

import { Setup } from '../Setup'
import { MeshWobbleMaterial, Torus } from '../../src'

export default {
  title: 'Shaders/MeshWobbleMaterial',
  component: MeshWobbleMaterial,
  decorators: [withKnobs, (storyFn) => <Setup> {storyFn()}</Setup>],
}

function MeshWobbleMaterialScene() {
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
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial
        attach="material"
        color="#f25042"
        speed={number('Speed', 1, { range: true, max: 10, step: 0.1 })}
        factor={number('Factor', 0.6, { range: true, min: 0, max: 1, step: 0.1 })}
        baseMaterial={options[base]}
      />
    </Torus>
  )
}

export const MeshWobbleMaterialSt = () => <MeshWobbleMaterialScene />
MeshWobbleMaterialSt.storyName = 'Default'

function MeshWobbleMaterialRefScene() {
  const material = React.useRef(null!)

  useFrame(({ clock }) => {
    material.current.factor = Math.abs(Math.sin(clock.getElapsedTime())) * 2
    material.current.speed = Math.abs(Math.sin(clock.getElapsedTime())) * 10
  })

  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial attach="material" color="#f25042" ref={material} />
    </Torus>
  )
}

export const MeshWobbleMaterialRefSt = () => <MeshWobbleMaterialRefScene />
MeshWobbleMaterialRefSt.storyName = 'Ref'
