import * as React from 'react'
import * as THREE from 'three/webgpu'
import {
  WireframeMaterial,
  WireframeMaterialProps,
  setBarycentricCoordinates,
} from '@webgpu/Materials/WireframeMaterial'

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

function isWireframeGeometry(geometry: any): geometry is THREE.WireframeGeometry {
  return (geometry as THREE.WireframeGeometry).type === 'WireframeGeometry'
}

function getInputGeometry(
  inputGeometry: THREE.BufferGeometry | React.RefObject<THREE.BufferGeometry> | React.RefObject<THREE.Object3D>
) {
  const geo = (isRefObject(inputGeometry) ? inputGeometry.current : inputGeometry)!

  if (!isGeometry(geo)) {
    // Disallow WireframeGeometry
    if (isWireframeGeometry(geo)) {
      throw new Error('Wireframe: WireframeGeometry is not supported.')
    }

    const parent = geo.parent
    if (isWithGeometry(parent)) {
      // Disallow WireframeGeometry
      if (isWireframeGeometry(parent.geometry)) {
        throw new Error('Wireframe: WireframeGeometry is not supported.')
      }

      return parent.geometry
    }
  } else {
    return geo
  }
}

function WireframeWithCustomGeo({
  geometry: customGeometry,
  simplify = false,
  ...props
}: WireframeProps & WireframeMaterialProps) {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry>(null!)

  React.useLayoutEffect(() => {
    let geom = getInputGeometry(customGeometry!)

    if (!geom) {
      throw new Error('Wireframe: geometry prop must be a BufferGeometry or a ref to a BufferGeometry.')
    }

    // setBarycentricCoordinates returns a new geometry if conversion was needed
    geom = setBarycentricCoordinates(geom)

    if (isRef(customGeometry)) {
      setGeometry(geom)
    }
  }, [simplify, customGeometry])

  const drawnGeo = isRef(customGeometry) ? geometry : customGeometry

  return (
    <>
      {drawnGeo && (
        <mesh geometry={drawnGeo}>
          <WireframeMaterial {...props} />
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

  React.useLayoutEffect(() => {
    let geom = getInputGeometry(objectRef)

    if (!geom) {
      throw new Error('Wireframe: Must be a child of a Mesh, Line or Points object or specify a geometry prop.')
    }
    const og = geom.clone()

    // setBarycentricCoordinates returns a new geometry if conversion was needed
    geom = setBarycentricCoordinates(geom)

    // Update parent mesh geometry if it changed
    const parent = objectRef.current.parent as THREE.Mesh
    if (parent && parent.geometry !== geom) {
      parent.geometry = geom
    }

    return () => {
      if (parent) {
        parent.geometry.dispose()
        parent.geometry = og
      }
    }
  }, [simplify])

  return <object3D ref={objectRef} />
}

/**
 * Renders a stylized wireframe effect on a mesh.
 * Supports backface rendering, dash patterns, and squeeze effects.
 *
 * WebGPU version using TSL-based WireframeMaterial.
 *
 * @example Basic usage
 * ```jsx
 * <mesh>
 *   <boxGeometry />
 *   <Wireframe stroke="white" squeeze />
 * </mesh>
 * ```
 */
export function Wireframe({ geometry: customGeometry, ...props }: WireframeProps & WireframeMaterialProps) {
  if (customGeometry) {
    return <WireframeWithCustomGeo geometry={customGeometry} {...props} />
  }

  return <WireframeWithoutCustomGeo {...props} />
}
