import * as React from 'react'
import * as THREE from 'three'
import * as FIBER from '@react-three/fiber'
import { applyProps } from '@react-three/fiber'
import { DecalGeometry } from 'three-stdlib'

type DecalProps = Omit<JSX.IntrinsicElements['meshStandardMaterial'], 'children'> & {
  debug?: boolean
  mesh?: React.MutableRefObject<THREE.Mesh>
  position?: FIBER.Vector3
  rotation?: FIBER.Euler | number
  scale?: FIBER.Vector3
  map?: THREE.Texture
  children?: React.ReactNode
}

function isArray(vec: any): vec is number[] {
  return Array.isArray(vec)
}

function vecToArray(vec: number[] | FIBER.Vector3 | FIBER.Euler | number = [0, 0, 0]) {
  if (isArray(vec)) {
    return vec
  } else if (vec instanceof THREE.Vector3 || vec instanceof THREE.Euler) {
    return [vec.x, vec.y, vec.z]
  } else {
    return [vec, vec, vec]
  }
}

export function Decal({ debug, mesh, children, position, rotation, scale, ...props }: DecalProps) {
  const ref = React.useRef<THREE.Mesh>(null!)
  const helper = React.useRef<THREE.Mesh>(null!)

  React.useLayoutEffect(() => {
    const parent = mesh?.current || ref.current.parent
    const target = ref.current
    if (!(parent instanceof THREE.Mesh)) {
      throw new Error('Decal must have a Mesh as parent or specify its "mesh" prop')
    }

    const state = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
    }

    if (parent) {
      applyProps(state as any, { position, scale })

      // Zero out the parents matrix world for this operation
      const matrixWorld = parent.matrixWorld.clone()
      parent.matrixWorld.identity()

      if (!rotation || typeof rotation === 'number') {
        const o = new THREE.Object3D()

        o.position.copy(state.position)
        o.lookAt(parent.position)
        if (typeof rotation === 'number') o.rotateZ(rotation)
        applyProps(state as any, { rotation: o.rotation })
      } else {
        applyProps(state as any, { rotation })
      }

      target.geometry = new DecalGeometry(parent, state.position, state.rotation, state.scale)
      if (helper.current) applyProps(helper.current as any, state)
      // Reset parents matix-world
      parent.matrixWorld = matrixWorld

      return () => {
        target.geometry.dispose()
      }
    }
  }, [mesh, ...vecToArray(position), ...vecToArray(scale), ...vecToArray(rotation)])

  return (
    <mesh ref={ref}>
      {children || <meshStandardMaterial transparent polygonOffset polygonOffsetFactor={-10} {...props} />}

      {debug && (
        <mesh ref={helper}>
          <boxGeometry />
          <meshNormalMaterial wireframe />
          <axesHelper />
        </mesh>
      )}
    </mesh>
  )
}
