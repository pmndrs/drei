import React, { Suspense } from 'react'
import { Canvas } from 'react-three-fiber'

import { OrbitControls } from '../src/OrbitControls'

export const setupDecorator = (_settings = {}) => function setupDecorator(Story) {

  const defaults = {
    controls: true,
    cameraPosition: [0, 0, 10],
    invalidateFrameLoop: false
  }

  const settings = {
    ...defaults,
    ..._settings,
  }

  const {
    controls,
    cameraPosition,
    ...props
  } = settings

  return (
    <Canvas 
      colorManagement 
      shadowMap 
      camera={{ position: cameraPosition }}
      pixelRatio={window.devicePixelRatio}
      className="testing"
      {...props}
      onCreated={({gl}) => {
        gl.setClearColor("#121212")
      }}
    >
      <Suspense fallback={null}>
        <Story />
      </Suspense>
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
      {controls && <OrbitControls />}
    </Canvas>
  )
  
}
