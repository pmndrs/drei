import * as React from 'react'
import {
  Mesh,
  BoxBufferGeometry,
  PlaneBufferGeometry,
  CylinderBufferGeometry,
  ConeBufferGeometry,
  CircleBufferGeometry,
  SphereBufferGeometry,
  TubeBufferGeometry,
  TorusBufferGeometry,
  TetrahedronBufferGeometry,
  RingBufferGeometry,
  PolyhedronBufferGeometry,
  OctahedronBufferGeometry,
  DodecahedronBufferGeometry,
  IcosahedronBufferGeometry,
  ExtrudeBufferGeometry,
  LatheBufferGeometry,
  TorusKnotBufferGeometry,
  CapsuleBufferGeometry,
} from 'three'

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T
export type ShapeProps<T> = Omit<JSX.IntrinsicElements['mesh'], 'args'> & {
  args?: Args<T>
  children?: React.ReactNode
}

function create<T>(type: string) {
  const El: any = type + 'BufferGeometry'
  return React.forwardRef(({ args, children, ...props }: ShapeProps<T>, ref) => (
    <mesh ref={ref as React.MutableRefObject<Mesh>} {...props}>
      <El attach="geometry" args={args} />
      {children}
    </mesh>
  ))
}

export const Box = create<typeof BoxBufferGeometry>('box')
export const Circle = create<typeof CircleBufferGeometry>('circle')
export const Cone = create<typeof ConeBufferGeometry>('cone')
export const Cylinder = create<typeof CylinderBufferGeometry>('cylinder')
export const Sphere = create<typeof SphereBufferGeometry>('sphere')
export const Plane = create<typeof PlaneBufferGeometry>('plane')
export const Tube = create<typeof TubeBufferGeometry>('tube')
export const Torus = create<typeof TorusBufferGeometry>('torus')
export const TorusKnot = create<typeof TorusKnotBufferGeometry>('torusKnot')
export const Tetrahedron = create<typeof TetrahedronBufferGeometry>('tetrahedron')
export const Ring = create<typeof RingBufferGeometry>('ring')
export const Polyhedron = create<typeof PolyhedronBufferGeometry>('polyhedron')
export const Icosahedron = create<typeof IcosahedronBufferGeometry>('icosahedron')
export const Octahedron = create<typeof OctahedronBufferGeometry>('octahedron')
export const Dodecahedron = create<typeof DodecahedronBufferGeometry>('dodecahedron')
export const Extrude = create<typeof ExtrudeBufferGeometry>('extrude')
export const Lathe = create<typeof LatheBufferGeometry>('lathe')
export const Capsule = create<typeof CapsuleBufferGeometry>('capsule')
