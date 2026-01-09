//* SpotLight - WebGPU/TSL Implementation ==============================
// Volumetric spotlight effect with distance attenuation and optional soft depth edges
// Inspired by http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html

import * as React from 'react'
import {
  Mesh,
  DepthTexture,
  Vector2,
  Vector3,
  CylinderGeometry,
  Matrix4,
  SpotLight as SpotLightImpl,
  Color,
  Object3D,
} from '#three'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { SpotLightMaterial } from '../../Materials/utils/SpotLightMaterial'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type SpotLightProps = Omit<ThreeElements['spotLight'], 'ref'> & {
  /** Depth texture for soft edge intersection with scene geometry */
  depthBuffer?: DepthTexture
  /** Distance attenuation factor (default: 5) */
  attenuation?: number
  /** Angle falloff power - higher = sharper edges (default: 5) */
  anglePower?: number
  /** Radius at the top of the cone (default: 0.1) */
  radiusTop?: number
  /** Radius at the bottom of the cone (default: angle * 7) */
  radiusBottom?: number
  /** Opacity of the volumetric effect (default: 1) */
  opacity?: number
  /** Light color (default: 'white') */
  color?: string | number
  /** Enable volumetric cone rendering (default: true) */
  volumetric?: boolean
  /** Show debug helpers (default: false) */
  debug?: boolean
}

//* Helpers ==============================

const isSpotLight = (child: Object3D | null): child is SpotLightImpl => {
  return (child as SpotLightImpl)?.isSpotLight
}

//* VolumetricMesh ==============================
// Renders the volumetric cone effect using TSL SpotLightMaterial

function VolumetricMesh({
  opacity = 1,
  radiusTop,
  radiusBottom,
  depthBuffer,
  color = 'white',
  distance = 5,
  angle = 0.15,
  attenuation = 5,
  anglePower = 5,
}: Omit<SpotLightProps, 'volumetric'>) {
  const mesh = React.useRef<Mesh>(null!)
  const size = useThree((state) => state.size)
  const camera = useThree((state) => state.camera)
  const dpr = useThree((state) => state.viewport.dpr)
  const [material] = React.useState(() => new SpotLightMaterial())
  const [spotVec] = React.useState(() => new Vector3())
  const [targetVec] = React.useState(() => new Vector3())

  radiusTop = radiusTop === undefined ? 0.1 : radiusTop
  radiusBottom = radiusBottom === undefined ? angle * 7 : radiusBottom

  //* Setup material properties --
  React.useLayoutEffect(() => {
    // Set color (convert to Color if needed)
    material.lightColor = typeof color === 'string' || typeof color === 'number' 
      ? new Color(color) 
      : color

    // Set other properties
    material.opacity = opacity
    material.attenuation = attenuation
    material.anglePower = anglePower
    material.cameraNear = camera.near
    material.cameraFar = camera.far

    // Depth buffer handling
    if (depthBuffer) {
      material.depth = depthBuffer
      material.resolution = new Vector2(size.width * dpr, size.height * dpr)
    } else {
      material.depth = null
      material.resolution = new Vector2(0, 0)
    }
  }, [material, color, opacity, attenuation, anglePower, camera.near, camera.far, depthBuffer, size.width, size.height, dpr])

  //* Update spot position and orientation each frame --
  useFrame(() => {
    if (!mesh.current) return

    // Update spot position uniform - copy values into the uniform's Vector3
    mesh.current.getWorldPosition(spotVec)
    const sp = material.spotPosition
    sp.x = spotVec.x
    sp.y = spotVec.y
    sp.z = spotVec.z

    // Look at the spotlight's target
    const parent = mesh.current.parent as any
    if (parent?.target) {
      mesh.current.lookAt(parent.target.getWorldPosition(targetVec))
    }
  })

  //* Create cone geometry --
  const geom = React.useMemo(() => {
    const geometry = new CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true)
    geometry.applyMatrix4(new Matrix4().makeTranslation(0, -distance / 2, 0))
    geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
    return geometry
  }, [distance, radiusTop, radiusBottom])

  return (
    <mesh ref={mesh} geometry={geom} raycast={() => null}>
      <primitive object={material} attach="material" />
    </mesh>
  )
}

//* SpotLight Component ==============================

export const SpotLight: ForwardRefComponent<React.PropsWithChildren<SpotLightProps>, SpotLightImpl> = 
  /* @__PURE__ */ React.forwardRef(
    (
      {
        // Volumetric props
        opacity = 1,
        radiusTop,
        radiusBottom,
        depthBuffer,
        color = 'white',
        distance = 5,
        angle = 0.15,
        attenuation = 5,
        anglePower = 5,
        volumetric = true,
        debug = false,
        children,
        ...props
      }: React.PropsWithChildren<SpotLightProps>,
      ref: React.ForwardedRef<SpotLightImpl>
    ) => {
      const spotlight = React.useRef<SpotLightImpl>(null!)
      React.useImperativeHandle(ref, () => spotlight.current, [])

      return (
        <group>
          {debug && spotlight.current && <spotLightHelper args={[spotlight.current]} />}

          <spotLight 
            ref={spotlight} 
            angle={angle} 
            color={color} 
            distance={distance} 
            castShadow 
            {...props}
          >
            {volumetric && (
              <VolumetricMesh
                opacity={opacity}
                radiusTop={radiusTop}
                radiusBottom={radiusBottom}
                depthBuffer={depthBuffer}
                color={color}
                distance={distance}
                angle={angle}
                attenuation={attenuation}
                anglePower={anglePower}
              />
            )}
          </spotLight>

          {/* Note: SpotLightShadow not yet supported in WebGPU version */}
          {children}
        </group>
      )
    }
  )

