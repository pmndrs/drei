import * as React from 'react'
import * as THREE from 'three'
import { withKnobs, boolean } from '@storybook/addon-knobs'

import { Setup } from '../Setup'

import { OrbitControls, Box, useFBO, Plane, PerspectiveCamera } from '../../src'
import { createPortal, useFrame, useResource } from 'react-three-fiber'

export function OrbitControlsStory() {
  return (
    <>
      <OrbitControls
        enablePan={boolean('Pan', true)}
        enableZoom={boolean('Zoom', true)}
        enableRotate={boolean('Rotate', true)}
      />
      <Box>
        <meshBasicMaterial attach="material" wireframe />
      </Box>
    </>
  )
}

OrbitControlsStory.storyName = 'Default'

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  decorators: [withKnobs, (storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

function CustomCamera() {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useResource<THREE.Camera>()
  const [virtualScene] = React.useState(() => new THREE.Scene())

  useFrame(({ gl }) => {
    if (virtualCamera.current) {
      gl.setRenderTarget(fbo)
      gl.render(virtualScene, virtualCamera.current)

      gl.setRenderTarget(null)
    }
  })

  return (
    <>
      <Plane args={[4, 4, 4]}>
        <meshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <meshBasicMaterial attach="material" wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />

          <OrbitControls
            camera={virtualCamera.current}
            enablePan={boolean('Pan', true)}
            enableZoom={boolean('Zoom', true)}
            enableRotate={boolean('Rotate', true)}
          />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = () => <CustomCamera />

CustomCameraStory.storyName = 'Custom Camera'
