import * as React from 'react'
import { withKnobs, number, boolean } from '@storybook/addon-knobs'
import { DragControls as DragControlsImpl } from 'three-stdlib'
import { Setup } from '../Setup'
import { Event, Object3D } from 'three'

import { Box, DragControls } from '../../src'

function DragControlsStory() {
  const meshRef1 = React.useRef<Object3D>(null!)
  const meshRef2 = React.useRef<Object3D>(null!)
  const dragControls = React.useRef<DragControlsImpl>(null!)

  const [objects, setObjects] = React.useState<Object3D[]>()

  React.useEffect(() => {
    if (!objects) setObjects([meshRef1.current, meshRef2.current])
    if (dragControls.current) {
      const { current: controls } = dragControls
      const handleDragStart = (event: Event) => {
        event.object.material.wireframe = false
      }
      const handleDragEnd = (event: Event) => {
        event.object.material.wireframe = true
      }
      controls.addEventListener('dragstart', handleDragStart)
      controls.addEventListener('dragend', handleDragEnd)
      return () => (
        controls.removeEventListener('dragstart', handleDragStart),
        controls.removeEventListener('dragend', handleDragEnd)
      )
    }
  }, [objects])

  return (
    <>
      {objects && <DragControls ref={dragControls} objects={objects} />}
      <Box ref={meshRef1}>
        <meshBasicMaterial attach="material" wireframe />
      </Box>
      <Box ref={meshRef2}>
        <meshBasicMaterial attach="material" wireframe />
      </Box>
    </>
  )
}

export const DragControlsSt = () => <DragControlsStory />

DragControlsSt.storyName = 'Default'

export default {
  title: 'Controls/DragControls',
  component: DragControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}
