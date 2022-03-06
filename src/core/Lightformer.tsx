import { applyProps, ReactThreeFiber } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import mergeRefs from 'react-merge-refs'

export type LightProps = JSX.IntrinsicElements['mesh'] & {
  args?: any[]
  map?: THREE.Texture
  toneMapped?: boolean
  color?: ReactThreeFiber.Color
  form?: 'circle' | 'ring' | 'rect' | any
  scale?: number | [number, number, number] | [number, number]
  intensity?: number
  target?: [number, number, number] | THREE.Vector3
}

export const Lightformer = React.forwardRef(
  (
    {
      args,
      map,
      toneMapped = false,
      color = 'white',
      form: Form = 'rect',
      intensity = 1,
      scale = 1,
      target,
      ...props
    }: LightProps,
    forwardRef
  ) => {
    // Apply emissive power
    const ref = React.useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null!)
    React.useLayoutEffect(() => {
      applyProps(ref.current.material as any, { color })
      ref.current.material.color.multiplyScalar(intensity)
    }, [color, intensity])

    // Target light
    React.useLayoutEffect(() => {
      if (target) ref.current.lookAt(Array.isArray(target) ? new THREE.Vector3(...target) : target)
    }, [target])

    // Fix 2-dimensional scale
    scale = Array.isArray(scale) && scale.length === 2 ? [scale[0], scale[1], 1] : scale

    return (
      <mesh ref={mergeRefs([ref, forwardRef])} scale={scale} {...props}>
        {Form === 'circle' ? (
          <ringGeometry args={[0, 1, 64]} />
        ) : Form === 'ring' ? (
          <ringGeometry args={[0.5, 1, 64]} />
        ) : Form === 'rect' ? (
          <planeGeometry />
        ) : (
          <Form args={args} />
        )}
        <meshBasicMaterial toneMapped={toneMapped} map={map} side={THREE.DoubleSide} />
      </mesh>
    )
  }
)
