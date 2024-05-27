'use client'

import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sphere, Environment, CameraControls } from '@react-three/drei' // eslint-disable-line import/no-unresolved

function App() {
  console.log('App')

  return (
    <Canvas camera={{ position: [1, 1, 1] }} style={{ width: 300, height: 150, background: 'white' }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}

function Scene() {
  useEffect(() => {
    console.log('useEffect')

    document.dispatchEvent(new Event('puppeteer:r3f'))
  }, [])

  return (
    <>
      <Sphere>
        <meshStandardMaterial roughness={0} metalness={1} />
      </Sphere>
      <Environment preset="city" />
      <CameraControls />
    </>
  )
}

export default App
