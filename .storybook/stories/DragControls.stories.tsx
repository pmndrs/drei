import * as React from 'react'
import * as THREE from 'three'
import { Box } from '../../src'
import { Setup } from '../Setup'
import { DragControls } from '../../src/web/DragControls'
import { Meta } from '@storybook/react'

export default {
  title: 'Gizmos/DragControls',
  component: DragControls,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>{storyFn()}</Setup>],
  argTypes: {
    axisLock: {
      control: { type: 'select', options: ['', 'x', 'y', 'z'] },
      description: 'Lock dragging to a specific axis',
      defaultValue: '',
    },
    dragLimits: {
      control: 'object',
      description: 'Set limits for dragging',
      defaultValue: {},
    },
    autoTransform: { control: false },
    matrix: { control: false },
  },
} as Meta

const Template = ({ axisLock, dragLimits }) => {
  const planes = [
    { axis: 'x', normal: new THREE.Vector3(1, 0, 0), color: 0xff0000 }, // X-axis
    { axis: 'y', normal: new THREE.Vector3(0, 1, 0), color: 0x00ff00 }, // Y-axis
    { axis: 'z', normal: new THREE.Vector3(0, 0, 1), color: 0x0000ff }, // Z-axis
  ]
  const planeHelpers = planes
    .filter(({ axis }) => !axisLock || axis === axisLock)
    .map(({ normal, color }) => new THREE.PlaneHelper(new THREE.Plane(normal, 0), 5, color))

  return (
    <>
      {planeHelpers.map((planeHelper, index) => (
        <primitive key={index} object={planeHelper} />
      ))}
      <DragControls axisLock={axisLock} dragLimits={dragLimits}>
        <Box>
          <meshBasicMaterial attach="material" wireframe={false} />
        </Box>
      </DragControls>
    </>
  )
}

export const DragControlsStory = Template.bind({})
