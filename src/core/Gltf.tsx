import * as React from 'react'
import * as THREE from 'three'
import { useGLTF } from './useGLTF'
import { Clone, CloneProps } from './Clone'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { ThreeElements } from '@react-three/fiber'

type GltfProps = Omit<ThreeElements['group'], 'children'> &
  Omit<CloneProps, 'object'> & {
    src: string
  }

export const Gltf: ForwardRefComponent<GltfProps, THREE.Object3D> = /* @__PURE__ */ React.forwardRef(
  ({ src, ...props }: GltfProps, ref: React.Ref<THREE.Object3D>) => {
    const { scene } = useGLTF(src)
    return <Clone ref={ref as any} {...props} object={scene} />
  }
)
