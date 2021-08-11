import { array, boolean, color, number, select, withKnobs } from '@storybook/addon-knobs'
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
    withKnobs,
  ],
}

const GizmoViewcubeStory = () => {
  const { scene } = useGLTF('LittlestTokyo.glb')
  const gizmo = select('gizmo', ['view cube', 'view port'], 'view cube', 'General')
  const controls = select('controls', ['orbit', 'trackball'], 'orbit', 'General')

  return (
    <>
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />
      <GizmoHelper
        alignment={select(
          'alignment',
          ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
          'bottom-right',
          'General'
        )}
        margin={[number('marginX', 80, {}, 'General'), number('marginY', 80, {}, 'General')]}
      >
        {gizmo === 'view cube' ? (
          <GizmoViewcube
            faces={array('faces', ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'], '|', 'ViewCube')}
            opacity={number('opacity', 1, { min: 0, max: 1, step: 0.1, range: true }, 'ViewCube')}
            color={color('color', 'white', 'ViewCube')}
            strokeColor={color('strokeColor', 'gray', 'ViewCube')}
            textColor={color('textColor', 'black', 'ViewCube')}
            hoverColor={color('hoverColor', 'lightgray', 'ViewCube')}
          />
        ) : (
          <GizmoViewport
            axisColors={[
              color('colorX', 'red', 'ViewPort'),
              color('colorY', 'green', 'ViewPort'),
              color('colorZ', 'blue', 'ViewPort'),
            ]}
            labelColor={color('labelColor', 'black', 'ViewPort')}
            hideNegativeAxes={boolean('hideNegativeAxes', false, 'ViewPort')}
          />
        )}
      </GizmoHelper>

      {controls === 'trackball' ? <TrackballControls makeDefault /> : <OrbitControls makeDefault />}
    </>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <GizmoViewcubeStory />
  </React.Suspense>
)

DefaultStory.storyName = 'Default'
