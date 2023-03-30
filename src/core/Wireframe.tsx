/**
 * Port of Matt DesLauriers's webgl-wireframes:
 * https://github.com/mattdesl/webgl-wireframes
 *
 * All credits go to the original author. This is a port to React Three Fiber.
 */

import { WireframeMaterial, WireframeMaterialProps, WireframeMaterialShaders } from '../materials/WireframeMaterial'
import * as React from 'react'
import * as THREE from 'three'
import * as FIBER from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshWireframeMaterial: FIBER.MaterialNode<THREE.ShaderMaterial, WireframeMaterialProps>
    }
  }
}

FIBER.extend({ MeshWireframeMaterial: WireframeMaterial })

type WithGeometry =
  | THREE.Mesh<THREE.BufferGeometry, THREE.Material>
  | THREE.Line<THREE.BufferGeometry, THREE.Material>
  | THREE.Points<THREE.BufferGeometry, THREE.Material>

interface WireframeProps {
  geometry?: THREE.BufferGeometry | React.RefObject<THREE.BufferGeometry>
  simplify?: boolean
  frames?: number
}

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
  ref: React.RefObject<THREE.Group | undefined>,
  inputGeometry?: THREE.BufferGeometry | React.RefObject<THREE.BufferGeometry>
) {
  // Ether the parent is a mesh, or we have an inputGeometry prop.
  const parent = ref.current?.parent
  if (!(isWithGeometry(parent) || inputGeometry)) {
    throw new Error("<Wireframe />: Must be a child of a mesh or specify it's `geometry` prop.")
  }

  // Get the geometry. Ether from the parent, or from the input props.
  const isInputGeomRef = isRefObject(inputGeometry)

  let geometry = (parent as THREE.Mesh)?.geometry || (isInputGeomRef ? inputGeometry.current : inputGeometry)

  if (!isGeometry(geometry)) {
    if (inputGeometry) {
      throw new Error('<Wireframe />: `geometry` prop must be a BufferGeometry or a ref to a BufferGeometry')
    } else {
      throw new Error('<Wireframe />: Must be a child of a mesh with a geometry')
    }
  }

  return geometry
}

function useUpdateUniform(
  uniforms: {
    [key: string]: { value: any }
  },
  props: any
) {
  for (const key in props) {
    React.useEffect(() => {
      if (uniforms[key]?.value !== undefined) {
        if (uniforms[key].value instanceof THREE.Color) {
          uniforms[key].value = new THREE.Color(props[key])
        } else {
          uniforms[key].value = props[key]
        }
      }
    }, [props[key]])
  }
}

export const Wireframe = React.forwardRef<THREE.Group, WireframeProps & WireframeMaterialProps>(
  ({ geometry: customGeometry, frames = Infinity, simplify, ...props }, forwardRef) => {
    const ref = React.useRef<THREE.Group>(null!)
    const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | undefined>(undefined)

    const uniforms = React.useMemo(() => getUniforms(), [WireframeMaterialShaders.uniforms])
    useUpdateUniform(uniforms, props)

    React.useLayoutEffect(() => {
      const geometry = getInputGeometry(ref, customGeometry)
      if (geometry.index) {
        console.warn('Wireframe: Requires non-indexed geometry, converting to non-indexed geometry.')
        const nonIndexedGeo = geometry.toNonIndexed()

        geometry.copy(nonIndexedGeo)
        geometry.setIndex(null)
      }

      const position = geometry.getAttribute('position')
      const emptyBarycentric = new THREE.BufferAttribute(new Float32Array(position.count * 3), 3)
      geometry.setAttribute('barycentric', emptyBarycentric)

      if (customGeometry) {
        setGeometry(geometry)
      } else {
        // Override parent material
        const parent = ref.current.parent as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
        const material = parent?.material

        if (!material) {
          throw new Error('<Wireframe />: Must be a child of a mesh with a material or use the `geometry` prop.')
        }

        material.onBeforeCompile = (shader) => {
          shader.uniforms = {
            ...shader.uniforms,
            ...uniforms,
          }

          shader.vertexShader = shader.vertexShader.replace(
            'void main() {',
            `
            ${WireframeMaterialShaders.vertex}
            void main() {
              initWireframe();
          `
          )

          shader.fragmentShader = shader.fragmentShader.replace(
            'void main() {',
            `
            ${WireframeMaterialShaders.fragment}
            void main() {
          `
          )

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            /* glsl */ `
            #include <color_fragment>
		        float edge = getWireframe();
            vec4 colorStroke = vec4(stroke, edge);
            #ifdef FLIP_SIDED
              colorStroke.rgb = backfaceStroke;
            #endif
            vec4 colorFill = vec4(mix(diffuseColor.rgb, fill, fillMix), mix(diffuseColor.a, fillOpacity, fillMix));
            vec4 outColor = mix(colorFill, colorStroke, edge * strokeOpacity);

            diffuseColor.rgb = outColor.rgb;
            diffuseColor.a *= outColor.a;
          `
          )
        }

        material.side = THREE.DoubleSide
        material.transparent = true
        material.polygonOffset = true
        material.polygonOffsetFactor = -1
      }
    }, [uniforms, customGeometry])

    const nFrames = React.useRef(0)
    FIBER.useFrame(() => {
      if (nFrames.current < frames) {
        const geometry = getInputGeometry(ref, customGeometry)
        const barycentric = geometry.getAttribute('barycentric') as THREE.BufferAttribute

        if (barycentric) {
          const newBarycentric = getBarycentricCoordinates(geometry, simplify)

          for (let i = 0; i < barycentric.count; i++) {
            barycentric.setXYZ(i, newBarycentric.getX(i), newBarycentric.getY(i), newBarycentric.getZ(i))
          }

          barycentric.needsUpdate = true
          nFrames.current++
        }
      }
    })

    return (
      <>
        <group ref={ref} />

        {(customGeometry || (isRef(customGeometry) && geometry)) && (
          <mesh geometry={isRef(customGeometry) ? geometry : customGeometry}>
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
)
