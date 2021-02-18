import { color, number, select, withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'
import { Vector3 } from 'three'
import { GizmoViewport, GizmoHelper, OrbitControls, useGLTF } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/GizmoViewport',
  component: GizmoViewport,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

const GizmoViewportStory = () => {
  const controlsRef = React.useRef<OrbitControls>()
  const { scene } = useGLTF('LittlestTokyo.glb')

  return (
    <>
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />
      <GizmoHelper
        alignment={select('alignment', ['top-left', 'top-right', 'bottom-right', 'bottom-left'], 'bottom-right')}
        margin={[number('marginX', 80), number('marginY', 80)]}
        onTarget={() => controlsRef?.current?.target as Vector3}
        onUpdate={() => controlsRef.current?.update!()}
      >
        <GizmoViewport
          axisColors={[color('colorX', 'red'), color('colorY', 'green'), color('colorZ', 'blue')]}
          labelColor={color('labelColor', 'black')}
        />
      </GizmoHelper>

      <OrbitControls ref={controlsRef} />
    </>
  )
}
export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <GizmoViewportStory />
  </React.Suspense>
)

DefaultStory.storyName = 'Default'
