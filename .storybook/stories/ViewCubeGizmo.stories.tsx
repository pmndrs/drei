import { number, select, withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'
import { extend } from 'react-three-fiber'
import { Vector3 } from 'three'
import { GizmoHelper, OrbitControls, PerspectiveCamera, useGLTF, ViewCubeGizmo } from '../../src'
import { Setup } from '../Setup'

extend({ OrbitControls })

export default {
  title: 'Gizmos/ViewCubeGizmo',
  component: ViewCubeGizmo,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

const ViewCubeGizmoStory = () => {
  const controlsRef = React.useRef<OrbitControls>()
  const { scene } = useGLTF('LittlestTokyo.glb')

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />
      <GizmoHelper
        alignment={select('alignment', ['top-left', 'top-right', 'bottom-right', 'bottom-left'], 'bottom-right')}
        margin={[number('marginX', 80), number('marginY', 80)]}
        onTarget={() => controlsRef?.current?.target as Vector3}
        onUpdate={() => controlsRef.current?.update!()}
      >
        <ViewCubeGizmo />
      </GizmoHelper>

      <OrbitControls ref={controlsRef} />
    </>
  )
}

export const DefaultStory = () => (
  <React.Suspense fallback={null}>
    <ViewCubeGizmoStory />
  </React.Suspense>
)

DefaultStory.storyName = 'Default'
