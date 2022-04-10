import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Particles, Environment, ContactShadows, PerspectiveCamera, OrbitControls } from '../../src'

export default {
  title: 'Staging/Particles',
  component: Particles,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(1, 1, 1)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const ParticlesStory = (props) => (
  <>
    <Particles {...props} color="cyan" />
    <OrbitControls />
    <axesHelper />
    <PerspectiveCamera position={[2, 2, 2]} makeDefault />
  </>
)

ParticlesStory.args = {
  radius: 1,
  size: 5,
  opacity: 1,
}

ParticlesStory.argTypes = {
  radius: {
    control: {
      type: 'range',
      min: 0,
      max: 50,
      step: 0.1,
    },
  },
  size: {
    control: {
      type: 'range',
      min: 0,
      max: 50,
      step: 0.1,
    },
  },
  opacity: {
    control: {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
}

ParticlesStory.storyName = 'Basic'
