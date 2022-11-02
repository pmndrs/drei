import * as React from 'react'
import { Group } from 'three'
import mergeRefs from 'react-merge-refs'
import { useFrame } from '@react-three/fiber'

type ScreenSpaceProps = JSX.IntrinsicElements['group'] & {
  depth?: number
}

export const ScreenSpace = React.forwardRef<Group, ScreenSpaceProps>(({ children, depth = -1, ...rest }, ref) => {
  const localRef = React.useRef<Group>(null)

  useFrame(({ camera }) => {
    localRef.current?.quaternion.copy(camera.quaternion)
    localRef.current?.position.copy(camera.position)
  })
  return (
    <group ref={mergeRefs([ref, localRef])} {...rest}>
      <group position-z={-depth}>{children}</group>
    </group>
  )
})
