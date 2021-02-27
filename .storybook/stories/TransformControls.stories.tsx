import * as React from 'react'
import { withKnobs, optionsKnob, boolean } from '@storybook/addon-knobs'
import { TransformControls as TransformControlsImpl } from 'three-stdlib/controls/TransformControls'

import { Setup } from '../Setup'

import { Box, OrbitControls, TransformControls } from '../../src'

export function TransformControlsStory() {
  return (
    <Setup>
      <TransformControls>
        <Box>
          <meshBasicMaterial attach="material" wireframe />
        </Box>
      </TransformControls>
    </Setup>
  )
}

TransformControlsStory.storyName = 'Default'

export default {
  title: 'Controls/TransformControls',
  component: TransformControls,
}

function TransformControlsLockScene({ mode, showX, showY, showZ }) {
  const orbitControls = React.useRef<OrbitControls>(null!)
  const transformControls = React.useRef<TransformControlsImpl>(null!)

  React.useEffect(() => {
    if (transformControls.current) {
      const { current: controls } = transformControls
      const callback = (event) => (orbitControls.current.enabled = !event.value)
      controls.addEventListener('dragging-changed', callback)
      return () => controls.removeEventListener('dragging-changed', callback)
    }
  })

  return (
    <>
      <TransformControls ref={transformControls} mode={mode} showX={showX} showY={showY} showZ={showZ}>
        <Box>
          <meshBasicMaterial attach="material" wireframe />
        </Box>
      </TransformControls>
      <OrbitControls ref={orbitControls} />
    </>
  )
}

export const TransformControlsLockSt = () => {
  const modesObj = {
    scale: 'scale',
    rotate: 'rotate',
    translate: 'translate',
  }

  return (
    <TransformControlsLockScene
      mode={optionsKnob('mode', modesObj, 'translate', {
        display: 'radio',
      })}
      showX={boolean('showX', true)}
      showY={boolean('showY', true)}
      showZ={boolean('showZ', true)}
    />
  )
}

TransformControlsLockSt.storyName = 'Lock orbit controls while transforming'
TransformControlsLockSt.decorators = [withKnobs, (storyFn) => <Setup controls={false}>{storyFn()}</Setup>]
