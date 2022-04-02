import { createPortal, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Scene } from 'three'

import { Setup } from '../Setup'
import { ArcballControls, Box, PerspectiveCamera, Plane, useFBO } from '../../src'

import type { OrthographicCamera, PerspectiveCamera as PerspectiveCameraType } from 'three'
import type { ArcballControlsProps } from '../../src'

const args = {
  enablePan: true,
  enableRotate: true,
  enableZoom: true,
}

export const ArcballControlsStory = (props: ArcballControlsProps) => (
  <>
    <ArcballControls {...props} />
    <Box>
      <meshBasicMaterial wireframe />
    </Box>
  </>
)

ArcballControlsStory.args = args
ArcballControlsStory.storyName = 'Default'

export default {
  title: 'Controls/ArcballControls',
  component: ArcballControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const CustomCamera = (props: ArcballControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<OrthographicCamera | PerspectiveCameraType>()
  const [virtualScene] = useState(() => new Scene())

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
            <meshBasicMaterial wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />

          <ArcballControls camera={virtualCamera.current} {...props} />

          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = (props: ArcballControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
