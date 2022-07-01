import * as React from 'react'
import { Vector3 } from 'three'
import { GizmoHelper, OrbitControls, useGLTF, GizmoViewcube, TrackballControls, GizmoViewport } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/GizmoHelper',
  component: GizmoHelper,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

const alignment = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'bottom-center',
  'center-right',
  'center-left',
  'center-center',
  'top-center',
]
const controls = ['OrbitControls', 'TrackballControls']
const faces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back']
const gizmos = ['GizmoViewcube', 'GizmoViewport']

const args = {
  alignment: alignment[2],
  color: 'white',
  colorX: 'red',
  colorY: 'green',
  colorZ: 'blue',
  controls: controls[0],
  faces,
  gizmo: gizmos[0],
  hideNegativeAxes: false,
  hoverColor: 'lightgray',
  labelColor: 'black',
  marginX: 80,
  marginY: 80,
  opacity: 1,
  strokeColor: 'gray',
  textColor: 'black',
}

const colorArgType = { control: { type: 'color' } }
const generalTable = { table: { categry: 'General' } }
const helperTable = { table: { category: 'GizmoHelper' } }
const viewcubeTable = { table: { category: 'GizmoViewcube' } }
const viewportTable = { table: { category: 'GizmoViewport' } }

const argTypes = {
  alignment: { control: { type: 'select' }, options: alignment, ...helperTable },
  color: { ...colorArgType, ...viewcubeTable },
  colorX: { ...colorArgType, ...viewportTable },
  colorY: { ...colorArgType, ...viewportTable },
  colorZ: { ...colorArgType, ...viewportTable },
  controls: {
    control: { type: 'select' },
    name: 'Controls',
    options: controls,
    ...generalTable,
  },
  faces: {
    control: { type: 'array' },
    options: faces,
    ...viewcubeTable,
  },
  gizmo: {
    control: { type: 'select' },
    name: 'Gizmo',
    options: gizmos,
    ...generalTable,
  },
  hideNegativeAxes: { ...viewportTable },
  hoverColor: { ...viewportTable },
  labelColor: { ...viewportTable },
  marginX: { ...helperTable },
  marginY: { ...helperTable },
  opacity: {
    control: { min: 0, max: 1, step: 0.01, type: 'range' },
    ...viewcubeTable,
  },
  strokeColor: { ...colorArgType, ...viewcubeTable },
  textColor: { ...colorArgType, ...viewcubeTable },
}

const GizmoHelperStoryImpl = ({
  alignment,
  color,
  colorX,
  colorY,
  colorZ,
  controls,
  faces,
  gizmo,
  hideNegativeAxes,
  hoverColor,
  labelColor,
  marginX,
  marginY,
  opacity,
  strokeColor,
  textColor,
}) => {
  const { scene } = useGLTF('LittlestTokyo.glb')

  return (
    <>
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />
      <GizmoHelper alignment={alignment} margin={[marginX, marginY]}>
        {gizmo === 'GizmoViewcube' ? (
          <GizmoViewcube
            {...{
              color,
              faces,
              hoverColor,
              opacity,
              strokeColor,
              textColor,
            }}
          />
        ) : (
          <GizmoViewport {...{ axisColors: [colorX, colorY, colorZ], hideNegativeAxes, labelColor }} />
        )}
      </GizmoHelper>

      {controls === 'TrackballControls' ? <TrackballControls makeDefault /> : <OrbitControls makeDefault />}
    </>
  )
}

export const GizmoHelperStory = (props) => (
  <React.Suspense fallback={null}>
    <GizmoHelperStoryImpl {...props} />
  </React.Suspense>
)

GizmoHelperStory.args = args
GizmoHelperStory.argTypes = argTypes
GizmoHelperStory.storyName = 'Default'
