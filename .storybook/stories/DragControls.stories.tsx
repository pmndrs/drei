import * as React from 'react'
import * as THREE from 'three'
import { Box } from '@react-three/drei'
import { Setup } from '../Setup'
import { DragControls } from '../../src/web/DragControls'
import { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentProps } from 'react'

export default {
  title: 'Gizmos/DragControls',
  component: DragControls,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof DragControls>

type Story = StoryObj<typeof DragControls>

const DragControlsScene = (props: ComponentProps<typeof DragControls>) => {
  const planes = [
    { axis: 'x', normal: new THREE.Vector3(1, 0, 0), color: 0xff0000 }, // X-axis
    { axis: 'y', normal: new THREE.Vector3(0, 1, 0), color: 0x00ff00 }, // Y-axis
    { axis: 'z', normal: new THREE.Vector3(0, 0, 1), color: 0x0000ff }, // Z-axis
  ]
  const planeHelpers = planes
    .filter(({ axis }) => !props.axisLock || axis === props.axisLock)
    .map(({ normal, color }) => new THREE.PlaneHelper(new THREE.Plane(normal, 0), 5, color))

  return (
    <>
      {planeHelpers.map((planeHelper, index) => (
        <primitive key={index} object={planeHelper} />
      ))}
      <DragControls {...props}>
        <Box>
          <meshBasicMaterial attach="material" wireframe={false} />
        </Box>
      </DragControls>
    </>
  )
}

export const DragControlsStory = {
  render: (args) => <DragControlsScene {...args} />,
} satisfies Story
