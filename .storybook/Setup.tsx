import React from 'react'
import * as THREE from 'three'
import { Canvas } from 'react-three-fiber'

import { OrbitControls } from '../src/OrbitControls'

export function Setup({ children, cameraPosition = new THREE.Vector3(-5, 5, 5), controls = true }) {
  return (
    <Canvas colorManagement shadowMap camera={{ position: cameraPosition }} pixelRatio={window.devicePixelRatio}>
      {children}
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
      {controls && <OrbitControls />}
    </Canvas>
  )
}
