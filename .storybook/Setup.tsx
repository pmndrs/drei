import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps, useThree } from '@react-three/fiber'

import { OrbitControls } from '../src'
import isChromatic from 'chromatic/isChromatic'
import { useEffect } from 'react'
import seedrandom from 'seedrandom'

const IS_CHROMATIC = isChromatic()
if (IS_CHROMATIC) {
  seedrandom('chromatic-seed', { global: true })
}

function SayCheese({ pauseAt = 3000 }) {
  const { clock, advance, setFrameloop, invalidate, gl } = useThree()

  useEffect(() => {
    console.log(`😬 Say cheeese (shooting photo in ${pauseAt}ms)`)

    setFrameloop('never')
    clock.elapsedTime = pauseAt / 1000 // Convert ms to seconds
    advance(pauseAt / 1000)
    invalidate()
    gl.getContext().finish()
  }, [pauseAt, clock, advance, invalidate, gl])

  return null
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
