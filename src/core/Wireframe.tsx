import * as React from 'react'
import * as THREE from 'three'
import * as FIBER from '@react-three/fiber'
import {
  WireframeMaterial,
  WireframeMaterialProps,
  WireframeMaterialShaders,
  setWireframeOverride,
  useWireframeUniforms,
} from '../materials/WireframeMaterial'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshWireframeMaterial: FIBER.MaterialNode<THREE.ShaderMaterial, WireframeMaterialProps>
    }
  }
}

FIBER.extend({ MeshWireframeMaterial: WireframeMaterial })

interface WireframeProps {
  geometry?: THREE.BufferGeometry | React.RefObject<THREE.BufferGeometry>
  simplify?: boolean
}

type WithGeometry =
  | THREE.Mesh<THREE.BufferGeometry, THREE.Material>
  | THREE.Line<THREE.BufferGeometry, THREE.Material>
  | THREE.Points<THREE.BufferGeometry, THREE.Material>

function isWithGeometry(object?: THREE.Object3D | null): object is WithGeometry {
  return !!(object as THREE.Mesh)?.geometry
}

function isGeometry(object?: any | null): object is THREE.BufferGeometry {
  return !!(object as THREE.BufferGeometry)?.isBufferGeometry
}

function isRefObject<T>(object?: any | null): object is React.RefObject<T> {
  return !!(object as React.RefObject<T>)?.current
}

function isRef<T>(object?: any | null): object is React.Ref<T> {
  return object?.current !== undefined
}

function getUniforms() {
  const u = {}
  for (const key in WireframeMaterialShaders.uniforms) {
    u[key] = { value: WireframeMaterialShaders.uniforms[key] }
  }
  return u
}

function getBarycentricCoordinates(geometry: THREE.BufferGeometry, removeEdge?: boolean) {
  const position = geometry.getAttribute('position')
  const count = position.count

  const barycentric: number[] = []

  for (let i = 0; i < count; i++) {
    const even = i % 2 === 0
    const Q = removeEdge ? 1 : 0
    if (even) {
      barycentric.push(0, 0, 1, 0, 1, 0, 1, 0, Q)
    } else {
      barycentric.push(0, 1, 0, 0, 0, 1, 1, 0, Q)
    }
  }

  return new THREE.BufferAttribute(Float32Array.from(barycentric), 3)
}

function getInputGeometry(
  inputGeometry: THREE.BufferGeometry | React.RefObject<THREE.BufferGeometry> | React.RefObject<THREE.Object3D>
) {
  const geo = (isRefObject(inputGeometry) ? inputGeometry.current : inputGeometry)!

  if (!isGeometry(geo)) {
    const parent = geo.parent
    if (isWithGeometry(parent)) {
      return parent.geometry
    }
  } else {
    return geo
  }
}

function setBarycentricCoordinates(geometry: THREE.BufferGeometry, simplify: boolean) {
  if (geometry.index) {
    console.warn('Wireframe: Requires non-indexed geometry, converting to non-indexed geometry.')
    const nonIndexedGeo = geometry.toNonIndexed()

    geometry.copy(nonIndexedGeo)
    geometry.setIndex(null)
  }

  const newBarycentric = getBarycentricCoordinates(geometry, simplify)

  geometry.setAttribute('barycentric', newBarycentric)
}

function WireframeWithCustomGeo({
  geometry: customGeometry,
  simplify = false,
  ...props
}: WireframeProps & WireframeMaterialProps) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry>(null!)

  React.useLayoutEffect(() => {
    const geom = getInputGeometry(customGeometry!)

    if (!geom) {
      throw new Error('Wireframe: geometry prop must be a BufferGeometry or a ref to a BufferGeometry.')
    }

    setBarycentricCoordinates(geom, simplify)

    if (isRef(customGeometry)) {
      setGeometry(geom)
    }
  }, [simplify, customGeometry])

  const drawnGeo = isRef(customGeometry) ? geometry : customGeometry

  return (
    <>
      {drawnGeo && (
        <mesh geometry={drawnGeo}>
          <meshWireframeMaterial
            attach="material"
            transparent
            side={THREE.DoubleSide}
            polygonOffset={true} //
            polygonOffsetFactor={-4}
            {...props}
            extensions={{
              derivatives: true,
              fragDepth: false,
              drawBuffers: false,
              shaderTextureLOD: false,
            }}
          />
        </mesh>
      )}
    </>
  )
}

function WireframeWithoutCustomGeo({
  simplify = false,
  ...props
}: Omit<WireframeProps, 'geometry'> & WireframeMaterialProps) {
  const objectRef = React.useRef<THREE.Object3D>(null!)
  const uniforms = React.useMemo(() => getUniforms(), [WireframeMaterialShaders.uniforms])
  useWireframeUniforms(uniforms, props)

  React.useLayoutEffect(() => {
    const geom = getInputGeometry(objectRef)

    if (!geom) {
      throw new Error('Wireframe: Must be a child of a Mesh, Line or Points object or specify a geometry prop.')
    }

    setBarycentricCoordinates(geom, simplify)
  }, [simplify])

  React.useLayoutEffect(() => {
    const parentMesh = objectRef.current.parent as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
    setWireframeOverride(parentMesh.material, uniforms)
  }, [])

  return <object3D ref={objectRef} />
}

export function Wireframe({ geometry: customGeometry, ...props }: WireframeProps & WireframeMaterialProps) {
  if (customGeometry) {
    return <WireframeWithCustomGeo geometry={customGeometry} {...props} />
  }

  return <WireframeWithoutCustomGeo {...props} />
}
