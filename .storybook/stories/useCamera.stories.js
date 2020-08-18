import React, { useRef, useMemo, useState } from 'react'
import { useFrame, useThree, createPortal } from 'react-three-fiber'
import * as THREE from 'three'
import { Setup } from '../Setup'
import { useCamera } from '../../src/useCamera'
import { OrthographicCamera } from '../../src/OrthographicCamera'
import { Box } from '../../src/shapes'

export default {
  title: 'Misc/useCamera',
  component: UseCameraScene,
  decorators: [
    (Story) => (
      <Setup cameraPosition={[0, 0, 5]}>
        <Story />
      </Setup>
    ),
  ],
}

function UseCameraScene() {
  const virtualCam = useRef()
  const ref = useRef()

  const [hover, set] = useState(null)

  const { gl, scene, camera } = useThree()

  const virtualScene = useMemo(() => new THREE.Scene(), [])
  const matrix = new THREE.Matrix4()

  useFrame(() => {
    matrix.getInverse(camera.matrix)
    ref.current.quaternion.setFromRotationMatrix(matrix)

    gl.autoClear = true
    gl.render(scene, camera)

    gl.autoClear = false
    gl.clearDepth()
    gl.render(virtualScene, virtualCam.current)
  }, 1)

  return createPortal(
    <>
      <OrthographicCamera ref={virtualCam} position={[0, 0, 100]} zoom={2} />

      <Box
        ref={ref}
        raycast={useCamera(virtualCam)}
        onPointerOut={() => set(null)}
        onPointerMove={(e) => set(Math.floor(e.faceIndex / 2))}
        args={[60, 60, 60]}>
        {[...Array(6)].map((_, index) => (
          <meshBasicMaterial attachArray="material" key={index} color="hotpink" wireframe={hover !== index} />
        ))}
      </Box>
    </>,
    virtualScene
  )
}

export const UseCameraSt = () => <UseCameraScene />

UseCameraSt.story = {
  name: 'Default',
}
