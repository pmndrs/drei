import * as React from 'react'
import * as THREE from 'three'
import { createPortal, useFrame } from '@react-three/fiber'

import { Setup } from '../Setup'

import { useFBO, TorusKnot, Box, PerspectiveCamera } from '../../src'

export default {
  title: 'Misc/useFBO',
  component: useFBO,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function SpinningThing() {
  const mesh = React.useRef<THREE.Mesh>(null!)
  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01
  })
  return (
    <TorusKnot ref={mesh} args={[1, 0.4, 100, 64]}>
      <meshNormalMaterial />
    </TorusKnot>
  )
}

function UseFBOScene({ color = 'orange', ...props }) {
  const cam = React.useRef<THREE.Camera>(null!)
  const scene = React.useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(color)
    return scene
  }, [color])
  const target = useFBO(props)

  useFrame((state) => {
    cam.current.position.z = 5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 2
    state.gl.setRenderTarget(target)
    state.gl.render(scene, cam.current)
    state.gl.setRenderTarget(null)
  })

  return (
    <>
      <PerspectiveCamera ref={cam} position={[0, 0, 3]} />
      {createPortal(<SpinningThing />, scene)}
      <Box args={[3, 3, 3]}>
        <meshStandardMaterial map={target.texture} />
      </Box>
    </>
  )
}

export const UseFBOSt = () => <UseFBOScene />
UseFBOSt.storyName = 'Default'

export const UseFBOWithSettings = () => (
  <UseFBOScene color="blue" multisample samples={8} stencilBuffer={false} format={THREE.RGBFormat} />
)
UseFBOWithSettings.storyName = 'With settings'
