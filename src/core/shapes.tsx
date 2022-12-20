import * as React from 'react'
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  CylinderGeometry,
  ConeGeometry,
  CircleGeometry,
  SphereGeometry,
  TubeGeometry,
  TorusGeometry,
  TetrahedronGeometry,
  RingGeometry,
  PolyhedronGeometry,
  OctahedronGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  TorusKnotGeometry,
  CapsuleGeometry,
} from 'three'

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T
export type ShapeProps<T> = Omit<JSX.IntrinsicElements['mesh'], 'args'> & {
  args?: Args<T>
  children?: React.ReactNode
}

function create<T>(type: string) {
  const El: any = type + 'Geometry'
  return React.forwardRef(({ args, children, ...props }: ShapeProps<T>, ref) => (
    <mesh ref={ref as React.MutableRefObject<Mesh>} {...props}>
      <El attach="geometry" args={args} />
      {children}
    </mesh>
  ))
}

export const Box = create<typeof BoxGeometry>('box')
export const Circle = create<typeof CircleGeometry>('circle')
export const Cone = create<typeof ConeGeometry>('cone')
export const Cylinder = create<typeof CylinderGeometry>('cylinder')
export const Sphere = create<typeof SphereGeometry>('sphere')
export const Plane = create<typeof PlaneGeometry>('plane')
export const Tube = create<typeof TubeGeometry>('tube')
export const Torus = create<typeof TorusGeometry>('torus')
export const TorusKnot = create<typeof TorusKnotGeometry>('torusKnot')
export const Tetrahedron = create<typeof TetrahedronGeometry>('tetrahedron')
export const Ring = create<typeof RingGeometry>('ring')
export const Polyhedron = create<typeof PolyhedronGeometry>('polyhedron')
export const Icosahedron = create<typeof IcosahedronGeometry>('icosahedron')
export const Octahedron = create<typeof OctahedronGeometry>('octahedron')
export const Dodecahedron = create<typeof DodecahedronGeometry>('dodecahedron')
export const Extrude = create<typeof ExtrudeGeometry>('extrude')
export const Lathe = create<typeof LatheGeometry>('lathe')
export const Capsule = create<typeof CapsuleGeometry>('capsule')
