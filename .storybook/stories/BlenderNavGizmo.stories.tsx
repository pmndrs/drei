import { color, number, select, withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'
import { extend } from 'react-three-fiber'
import { Vector3 } from 'three'
import { BlenderViewportGizmo, GizmoHelper, OrbitControls, PerspectiveCamera, useGLTF } from '../../src'
import { Setup } from '../Setup'

extend({ OrbitControls })

export default {
  title: 'Gizmos/BlenderViewportGizmo',
  component: BlenderViewportGizmo,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

const BlenderViewportGizmoStory = () => {
  const controlsRef = React.useRef<OrbitControls>()
  const { scene } = useGLTF('LittlestTokyo.glb')

  return (
    <React.Suspense fallback={null}>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <primitive object={scene} scale={[0.01, 0.01, 0.01]} />

      <GizmoHelper
        alignment={select('alignment', ['top-left', 'top-right', 'bottom-right', 'bottom-left'], 'bottom-right')}
        margin={[number('marginX', 80), number('marginY', 80)]}
        onTarget={() => controlsRef?.current?.target as Vector3}
        onUpdate={() => controlsRef.current?.update!()}
      >
        <BlenderViewportGizmo
          axisColors={[color('colorX', 'red'), color('colorY', 'green'), color('colorZ', 'blue')]}
          labelColor={color('labelColor', 'black')}
        />
      </GizmoHelper>

      <OrbitControls ref={controlsRef} />
    </React.Suspense>
  )
}

export const BlenderViewportGizmoStorySt = () => <BlenderViewportGizmoStory />
BlenderViewportGizmoStorySt.storyName = 'Default'
