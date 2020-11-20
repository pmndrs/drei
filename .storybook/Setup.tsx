import * as React from 'react'
import { Canvas } from 'react-three-fiber'

import { OrbitControls } from '../src/OrbitControls'

const defaultCameraPosition: [number, number, number] = [-5, 5, 5]
const position: [number, number, number] = [0, 6, 0]
const pixelRatio = typeof document !== 'undefined' ? window.devicePixelRatio : undefined

export function Setup({ children, cameraPosition = defaultCameraPosition, controls = true }) {
  const cameraMemo = React.useMemo(
    function memo() {
      return { position: cameraPosition }
    },
    [cameraPosition]
  )

  return (
    <Canvas colorManagement shadowMap camera={cameraMemo} pixelRatio={pixelRatio}>
      {children}
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={position} />
      {controls && <OrbitControls />}
    </Canvas>
  )
}
