import { number, select, withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'
import { Vector3 } from 'three'
import { GizmoHelper, OrbitControls, useGLTF, GizmoViewcube } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Gizmos/GizmoViewcube',
  component: GizmoViewcube,
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
        <GizmoViewcube />
      </GizmoHelper>

      <OrbitControls ref={controlsRef} />
    </>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <GizmoViewcubeStory />
  </React.Suspense>
)

DefaultStory.storyName = 'Default'
