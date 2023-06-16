import { Group, Texture } from 'three'
import * as React from 'react'
import { useFrame } from '@react-three/fiber'

import { useCubeCamera, CubeCameraOptions } from './useCubeCamera'

type Props = Omit<JSX.IntrinsicElements['group'], 'children'> & {
  /** The contents of CubeCamera will be hidden when filming the cube */
  children: (tex: Texture) => React.ReactNode
  /** Number of frames to render, Infinity */
  frames?: number
} & CubeCameraOptions

export function CubeCamera({ children, frames = Infinity, resolution, near, far, envMap, fog, ...props }: Props) {
  const ref = React.useRef<Group>()
  const { fbo, camera, update } = useCubeCamera({
    resolution,
    near,
    far,
    envMap,
    fog,
  })

  let count = 0
  useFrame(() => {
    if (ref.current && (frames === Infinity || count < frames)) {
      ref.current.visible = false
      update()
      ref.current.visible = true
      count++
    }
  })
  return (
    <group {...props}>
      <primitive object={camera} />
      <group ref={ref}>{children(fbo.texture)}</group>
    </group>
  )
}
