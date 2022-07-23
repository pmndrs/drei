import * as React from 'react'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Sparkles, PerspectiveCamera, OrbitControls } from '../../src'

export default {
  title: 'Staging/Sparkles',
  component: Sparkles,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(1, 1, 1)} controls={false}>
        {storyFn()}
      </Setup>
    ),
  ],
}

export const SparklesStory = ({ random, size, amount, ...props }) => {
  const sizes = React.useMemo(() => {
    return new Float32Array(Array.from({ length: amount }, () => Math.random() * size))
  }, [size, amount])

  return (
    <>
      <Sparkles {...props} size={random ? sizes : size} color="orange" count={amount} />
      <OrbitControls />
      <axesHelper />
      <PerspectiveCamera position={[2, 2, 2]} makeDefault />
    </>
  )
}

SparklesStory.args = {
  size: 5,
  opacity: 1,
  amount: 100,
  speed: 0.3,
  noise: 1,
  random: true,
}

SparklesStory.argTypes = {
  amount: {
    control: {
      type: 'range',
      min: 0,
      max: 500,
      step: 1,
    },
  },
  noise: {
    control: {
      type: 'range',
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
  size: {
    control: {
      type: 'range',
      min: 0,
      max: 10,
      step: 1,
    },
  },
  speed: {
    control: {
      type: 'range',
      min: 0,
      max: 20,
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

SparklesStory.storyName = 'Basic'
