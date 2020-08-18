import React, { useRef, useEffect } from 'react'

import { setupDecorator } from '../setup-decorator'

import { TransformControls } from '../../src/TransformControls'
import { Box } from '../../src/shapes'
import { OrbitControls } from '../../src/OrbitControls'

export function TransformControlsStory() {
  return (
    <TransformControls>
      <Box material-wireframe />
    </TransformControls>
  )
}

TransformControlsStory.storyName = 'Default'
TransformControlsStory.decorators = [setupDecorator()]

export default {
  title: 'Controls/TransformControls',
  component: TransformControls,
}

export function TransformControlsLockScene({ mode, showX, showY, showZ }) {
  const orbitControls = useRef()
  const transformControls = useRef()

  useEffect(() => {
    if (transformControls.current) {
      const controls = transformControls.current
      const callback = (event) => (orbitControls.current.enabled = !event.value)
      controls.addEventListener('dragging-changed', callback)
      return () => controls.removeEventListener('dragging-changed', callback)
    }
  })

  return (
    <>
      <TransformControls ref={transformControls} mode={mode} showX={showX} showY={showY} showZ={showZ}>
        <Box material-wireframe />
      </TransformControls>
      <OrbitControls ref={orbitControls} />
    </>
  )
}


TransformControlsLockScene.storyName = 'Lock orbit controls while transforming'
TransformControlsLockScene.decorators = [
  setupDecorator({ controls: false })
]
