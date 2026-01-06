/* eslint react-hooks/exhaustive-deps: 1 */

import * as React from 'react'
import { Vector3 } from 'three'
import { Canvas, CanvasProps } from '@react-three/fiber'

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
    </Canvas>
  )
}
