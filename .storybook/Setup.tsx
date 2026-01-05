/* eslint react-hooks/exhaustive-deps: 1 */

import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps, useThree } from '@react-three/fiber'
import isChromatic from 'chromatic/isChromatic'
import { useEffect } from 'react'
import seedrandom from 'seedrandom'

import { OrbitControls } from '../src'

const IS_CHROMATIC = isChromatic()

if (IS_CHROMATIC) {
  seedrandom('chromatic-seed', { global: true })
}

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

    {IS_CHROMATIC && <SayCheese />}
  </Canvas>
)

function SayCheese({ pauseAt = 3000 }) {
  const { clock, advance, setFrameloop, invalidate, gl, scene } = useThree()

  useEffect(() => {
    console.log(`😬 Say cheeese (shooting photo in ${pauseAt}ms)`)

    // Let the scene render normally first to allow Suspense to resolve
    const timer = setTimeout(() => {
      const timestamp = pauseAt / 1000 // Convert ms to seconds

      // Freeze animation
      setFrameloop('never')
      clock.elapsedTime = timestamp
      clock.start()

      // Disable auto-update for all objects that might animate
      scene.traverse((obj) => {
        if (obj.matrixAutoUpdate) obj.matrixAutoUpdate = false
      })

      advance(timestamp)
      invalidate()

      // Use RAF to ensure render completes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gl.getContext().finish()
        })
      })
    }, 3000) // Wait 3000 for assets (like fonts) to load

    return () => clearTimeout(timer)
  }, [pauseAt, clock, advance, invalidate, gl, scene, setFrameloop])

  return null
}
