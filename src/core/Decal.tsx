import * as React from 'react'
import * as THREE from 'three'
import * as FIBER from '@react-three/fiber'
import { DecalGeometry } from 'three-stdlib'

interface DecalProps {
  debug: boolean
  mesh: React.MutableRefObject<THREE.Mesh>
  position: FIBER.Vector3
  rotation: FIBER.Euler
  scale: FIBER.Vector3
}

function setProp(value: any, targetProp: any) {
  if (Array.isArray(value)) {
    if (targetProp.fromArray) targetProp.fromArray(value)
    else targetProp.set(...value)
  } else {
    targetProp.copy(value)
  }
}

export function Decal({
  debug,
  mesh,
  children,
  position,
  rotation,
  scale,
}: React.PropsWithChildren<Partial<DecalProps>>) {
  const ref = React.useRef<THREE.Mesh>(null!)

  const [[p, r, s]] = React.useState<[THREE.Vector3, THREE.Euler, THREE.Vector3]>(() => {
    return [new THREE.Vector3(), new THREE.Euler(), new THREE.Vector3(1, 1, 1)]
  })

  React.useLayoutEffect(() => {
    const parent = mesh?.current || ref.current.parent
    if (!(parent instanceof THREE.Mesh)) {
      throw new Error('Decal must have a Mesh as parent or specify its "mesh" prop')
    }

    if (parent) {
      setProp(position, p)
      setProp(rotation, r)
      setProp(scale, s)

      ref.current.geometry = new DecalGeometry(parent, p, r, s)
    }
  }, [mesh, position, scale, rotation, p, r, s])

  return (
    <mesh ref={ref}>
      {children || (
        <meshNormalMaterial
          transparent={true}
          depthTest={true}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-4}
        />
      )}

      {debug && (
        <mesh position={position} rotation={rotation} scale={scale}>
          <boxGeometry />
          <meshNormalMaterial wireframe />
          <axesHelper />
        </mesh>
      )}
    </mesh>
  )
}
