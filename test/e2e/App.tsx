// @ts-nocheck
'use client'

import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
// @ts-expect-error - drei is built during test setup, types not available here
import { Sphere, Environment, CameraControls } from '@react-three/drei' // eslint-disable-line import/no-unresolved
import * as THREE from 'three'

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
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    //* Runtime Three.js Information ==============================
    console.group('%c🔷 Three.js Runtime Info', 'color: #00d9ff; font-weight: bold; font-size: 14px')

    // Three.js version
    console.log('%cThree.js Version:', 'color: #00d9ff; font-weight: bold', `r${THREE.REVISION}`)

    // Renderer info
    console.log('%cRenderer:', 'color: #00d9ff; font-weight: bold', gl.info.render)

    // Tone mapping
    const toneMappingNames: Record<number, string> = {
      [THREE.NoToneMapping]: 'NoToneMapping',
      [THREE.LinearToneMapping]: 'LinearToneMapping',
      [THREE.ReinhardToneMapping]: 'ReinhardToneMapping',
      [THREE.CineonToneMapping]: 'CineonToneMapping',
      [THREE.ACESFilmicToneMapping]: 'ACESFilmicToneMapping',
      [THREE.CustomToneMapping]: 'CustomToneMapping',
    }
    const toneMappingName = toneMappingNames[gl.toneMapping] || `Unknown (${gl.toneMapping})`
    console.log('%cTone Mapping:', 'color: #00d9ff; font-weight: bold', toneMappingName)

    // Color space
    const colorSpaceNames: Record<string, string> = {
      srgb: 'SRGBColorSpace',
      'srgb-linear': 'LinearSRGBColorSpace',
      'display-p3': 'DisplayP3ColorSpace',
      rec2020: 'Rec2020ColorSpace',
    }
    const colorSpaceName = colorSpaceNames[gl.outputColorSpace] || gl.outputColorSpace
    console.log('%cOutput Color Space:', 'color: #00d9ff; font-weight: bold', colorSpaceName)

    console.groupEnd()
    //* ============================================================

    // Expose a simple flag the e2e test can assert on
    // @ts-ignore
    window.isPerspectiveCam = (camera as any)?.isPerspectiveCamera === true

    document.dispatchEvent(new Event('playright:r3f'))
  }, [gl, camera])

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
