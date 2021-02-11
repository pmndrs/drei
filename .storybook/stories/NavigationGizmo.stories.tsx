import { withKnobs } from '@storybook/addon-knobs'
import * as React from 'react'
import { extend } from 'react-three-fiber'
import { Mesh, Vector3 } from 'three'
import { OrbitControls, useGLTF, NavigationGizmo } from '../../src'
import { Setup } from '../Setup'

extend({ OrbitControls })

export default {
  title: 'Misc/NavigationGizmo',
  component: NavigationGizmo,
  decorators: [
    (storyFn) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        {storyFn()}
      </Setup>
    ),
    withKnobs,
  ],
}

function Suzanne() {
  const { nodes, materials } = useGLTF('suzanne.glb', true)
  return <mesh material={materials['Material.001']} geometry={(nodes.Suzanne as Mesh).geometry} />
}

const NavigationGizmoStory = () => {
  const controlsRef = React.useRef<OrbitControls>()
  return (
    <React.Suspense fallback={null}>
      <Suzanne />
      <NavigationGizmo
        colorX="red"
        colorY="green"
        colorZ="blue"
        onAxisSelected={() => controlsRef?.current?.target as Vector3}
        onUpdate={() => controlsRef.current?.update!()}
      />
      <OrbitControls ref={controlsRef} />
    </React.Suspense>
  )
}

export const NavigationGizmoSt = () => <NavigationGizmoStory />
NavigationGizmoSt.storyName = 'Default'
