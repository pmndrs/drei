import * as React from 'react'
import { useGLTF } from './useGLTF'
import { Clone, CloneProps } from './Clone'

type GltfProps = JSX.IntrinsicElements['primitive'] &
  CloneProps & {
    src: string
  }

export const Gltf = React.forwardRef<THREE.Group, GltfProps>(({ src, ...props }, ref) => {
  const { scene } = useGLTF(src)
  return <Clone ref={ref} {...props} object={scene} />
})
