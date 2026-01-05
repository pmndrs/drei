/* eslint react-hooks/exhaustive-deps: 1 */

import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps, useThree } from '@react-three/fiber'
import isChromatic from 'chromatic/isChromatic'
import { useEffect } from 'react'

import { OrbitControls } from '../src'
import { flushSync } from 'react-dom'

type Props = React.PropsWithChildren<
  CanvasProps & {
    cameraFov?: number
    cameraPosition?: Vector3
    controls?: boolean
    lights?: boolean
  }
>

export const Setup = ({
  children,
  cameraFov = 75,
  cameraPosition = new Vector3(-5, 5, 5),
  controls = true,
  lights = true,
  ...restProps
}: Props) => (
  <Canvas shadows camera={{ position: cameraPosition, fov: cameraFov }} {...restProps}>
    {children}
    {lights && (
      <>
        <ambientLight intensity={0.8 * Math.PI} />
        <pointLight intensity={1 * Math.PI} position={[0, 6, 0]} decay={0} />
      </>
    )}
    {controls && <OrbitControls makeDefault />}

    {isChromatic() && <SayCheese />}
  </Canvas>
)

/**
 * TODO
 */
function SayCheese({ pauseAt = 3000 }) {
  const { clock, advance, setFrameloop, invalidate, gl, scene, camera } = useThree()

  useEffect(() => {
    console.log(`😬 Say cheeese (shooting photo in ${pauseAt}ms)`)

    // clock.autoStart = false // Prevent clock from auto-starting during loading

    // Let the scene render normally first to allow Suspense to resolve
    const timer = setTimeout(() => {
      const timestamp = pauseAt / 1000 // Convert ms to seconds

      // Set clock time first
      // clock.elapsedTime = timestamp

      // Freeze the frameloop BEFORE rendering
      setFrameloop('never')

      // Render one frame at the target timestamp
      advance(timestamp, true)

      // Disable auto-update for all objects to freeze everything
      // scene.traverse((obj) => {
      //   obj.matrixAutoUpdate = false
      //   obj.updateMatrix()
      //   obj.updateMatrixWorld()
      // })

      // Wait for render to complete
      requestAnimationFrame(() => {
        gl.getContext().finish()
        // requestAnimationFrame(() => {
        //   flushSync(() => {})
        //   invalidate()
        //   gl.getContext().finish()
        // })
      })
    }, 5000) // Wait 5000ms for assets to load - increased for stability

    return () => clearTimeout(timer)
  }, [pauseAt, clock, advance, invalidate, gl, scene, camera, setFrameloop])

  return null
}
