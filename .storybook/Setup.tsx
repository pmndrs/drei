/* eslint react-hooks/exhaustive-deps: 1 */

import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps, useThree } from '@react-three/fiber'
import isChromatic from 'chromatic/isChromatic'

import { OrbitControls } from '../src'

type Props = React.PropsWithChildren<
  CanvasProps & {
    cameraFov?: number
    cameraPosition?: Vector3
    controls?: boolean
    lights?: boolean
    backend?: 'webgpu' | 'webgl'
  }
>

export const Setup = ({
  children,
  cameraFov = 75,
  cameraPosition = new Vector3(-5, 5, 5),
  controls = true,
  lights = true,
  backend,
  ...restProps
}: Props) => {
  console.log('Current backend in Setup:', backend)

  return (
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
}

/**
 * A helper component to pause the frameloop at a consistent time for snapshots
 */
function SayCheese({ pauseAt = 3000 }: { pauseAt?: number }) {
  const { clock, advance, setFrameloop, invalidate, gl, scene, camera } = useThree()

  React.useEffect(() => {
    // console.log(`😬 Say cheeese (pausing at ${pauseAt}ms)`)

    // Wait for assets to load before pausing the frameloop
    const timer = setTimeout(() => {
      setFrameloop('never')

      const timestamp = pauseAt / 1000 // Convert ms to seconds
      advance(timestamp, true)

      // Wait for render to complete
      requestAnimationFrame(() => {
        gl.getContext().finish()
      })
    }, 5000) // Let the scene render normally first to allow Suspense to resolve

    return () => clearTimeout(timer)
  }, [pauseAt, clock, advance, invalidate, gl, scene, camera, setFrameloop])

  return null
}
