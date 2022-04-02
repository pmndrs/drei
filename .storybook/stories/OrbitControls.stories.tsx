import { createPortal, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Scene } from 'three'

import { Setup } from '../Setup'
import { Box, OrbitControls, PerspectiveCamera, Plane, useFBO } from '../../src'

import type { Camera } from 'three'
import type { OrbitControlsProps } from '../../src'

const args = {
  enableDamping: true,
  enablePan: true,
  enableRotate: true,
  enableZoom: true,
  reverseOrbit: false,
}

export const OrbitControlsStory = (props: OrbitControlsProps) => (
  <>
    <OrbitControls {...props} />
    <Box>
      <meshBasicMaterial wireframe />
    </Box>
  </>
)

OrbitControlsStory.args = args
OrbitControlsStory.storyName = 'Default'

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const CustomCamera = (props: OrbitControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<Camera>()
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
          <OrbitControls camera={virtualCamera.current} {...props} />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = (props: OrbitControlsProps) => <CustomCamera {...props} />

CustomCameraStory.args = args
CustomCameraStory.storyName = 'Custom Camera'
