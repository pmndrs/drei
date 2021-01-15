import * as React from 'react'
import { useFrame, useThree, createPortal } from 'react-three-fiber'
import * as THREE from 'three'

import { Setup } from '../Setup'

import { useCamera, OrthographicCamera } from '../../src'

export default {
  title: 'Misc/useCamera',
  component: UseCameraScene,
  decorators: [(storyFn) => <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>{storyFn()}</Setup>],
}

function UseCameraScene() {
  const virtualCam = React.useRef<THREE.Camera>(null!)
  const ref = React.useRef<THREE.Mesh>()

  const [hover, set] = React.useState<null | number>(null)

  const { gl, scene, camera } = useThree()

  const virtualScene = React.useMemo(() => new THREE.Scene(), [])

  const matrix = new THREE.Matrix4()

  useFrame(() => {
    matrix.copy(camera.matrix).invert()

    if (ref.current) {
      ref.current.quaternion.setFromRotationMatrix(matrix)
    }

    gl.autoClear = true
    gl.render(scene, camera)

    gl.autoClear = false
    gl.clearDepth()
    gl.render(virtualScene, virtualCam.current)
  }, 1)

  return (createPortal(
    <>
      <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} zoom={2} />

      <mesh
        ref={ref}
        raycast={useCamera(virtualCam)}
        onPointerOut={() => set(null)}
        onPointerMove={(e) => set(Math.floor(e.faceIndex ?? 0 / 2))}
      >
        {[...Array(6)].map((_, index) => (
          <meshLambertMaterial attachArray="material" key={index} color="hotpink" wireframe={hover !== index} />
        ))}
        <boxBufferGeometry attach="geometry" args={[60, 60, 60]} />
      </mesh>

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </>,
    virtualScene
  ) as unknown) as JSX.Element
}

export const UseCameraSt = () => <UseCameraScene />

UseCameraSt.story = {
  name: 'Default',
}
