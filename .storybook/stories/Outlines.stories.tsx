import React from 'react'
import * as THREE from 'three'
import { withKnobs } from '@storybook/addon-knobs'
import { Setup } from '../Setup'
import { Outlines } from '../../src'

export default {
  title: 'Abstractions/Outlines',
  component: Outlines,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 10)}> {storyFn()}</Setup>],
}

function OutlinesScene() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial />
      <Outlines thickness={0.1} color="hotpink" />
    </mesh>
  )
}

export const OutlinesSt = () => <OutlinesScene />
OutlinesSt.storyName = 'Default'
