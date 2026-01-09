//* SpotLight - WebGPU/TSL Implementation ==============================
// Volumetric spotlight effect using TSL-native patterns
// Based on John Chapman's "Good Enough Volumetrics for Spotlights"
// https://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html
//
// Frame ordering for soft edges (when depthBuffer provided):
// 1. 'update' - normal position/lookAt updates
// 2. 'spotlightHide' - hide volumetric mesh
// 3. 'depthCapture' - useDepthBuffer captures scene (mesh invisible)
// 4. (after depthCapture) - show volumetric mesh
// 5. 'render' - main render with depth-aware soft edges

import * as React from 'react'
import {
  Mesh,
  Texture,
  Vector2,
  Vector3,
  CylinderGeometry,
  Matrix4,
  SpotLight as SpotLightImpl,
  Color,
  Object3D,
} from '#three'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { SpotLightMaterial } from '../../Materials/SpotLightMaterial'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type SpotLightProps = Omit<ThreeElements['spotLight'], 'ref'> & {
  /** Depth texture for soft edge intersection with scene geometry */
  depthBuffer?: Texture
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

// Generate unique ID for each spotlight instance
let spotlightIdCounter = 0
const generateSpotlightId = () => `spotlight_${spotlightIdCounter++}`

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
  const [tempVec] = React.useState(() => new Vector3())

  // Unique ID for this spotlight's frame hooks
  const [instanceId] = React.useState(() => generateSpotlightId())

  // Calculate radii
  radiusTop = radiusTop === undefined ? 0.1 : radiusTop
  radiusBottom = radiusBottom === undefined ? angle * 7 : radiusBottom

  //* Setup material properties --
  React.useLayoutEffect(() => {
    material.lightColor = typeof color === 'string' || typeof color === 'number' ? new Color(color) : color
    material.opacity = opacity
    material.attenuation = attenuation
    material.anglePower = anglePower
    material.cameraNear = camera.near
    material.cameraFar = camera.far

    // Depth buffer for soft edges (now a color texture with depth in R channel)
    if (depthBuffer) {
      material.depth = depthBuffer
      material.resolution = new Vector2(size.width * dpr, size.height * dpr)
    } else {
      material.depth = null
      material.resolution = new Vector2(0, 0)
    }
  }, [material, color, opacity, attenuation, anglePower, camera.near, camera.far, depthBuffer, size.width, size.height, dpr])

  //* Update spot position and orientation each frame --
  // Runs during default 'update' phase
  useFrame(() => {
    if (!mesh.current) return

    // Update spot position uniform
    const sp = material.spotPosition
    mesh.current.getWorldPosition(sp)

    // Look at the spotlight's target
    const parent = mesh.current.parent as any
    if (parent?.target) {
      mesh.current.lookAt(parent.target.getWorldPosition(tempVec))
    }
  })

  //* Frame ordering for depth buffer soft edges --
  // When depthBuffer is provided, we need to hide the volumetric mesh
  // before the depth capture pass, then show it again before main render

  // Step 1: Hide mesh AFTER 'update', BEFORE depth capture
  // Uses unique ID to avoid conflicts with other spotlights
  // All spotlights will register their hide callback, but that's fine
  useFrame(
    () => {
      if (mesh.current && depthBuffer) {
        mesh.current.visible = false
      }
    },
    { id: `spotlightHide_${instanceId}`, after: 'update', before: 'depthCapture' }
  )

  // Step 2: Show mesh AFTER depth capture, BEFORE main render
  // The depth buffer has been captured without the cone, now show it for rendering
  useFrame(
    () => {
      if (mesh.current && depthBuffer) {
        mesh.current.visible = true
      }
    },
    { id: `spotlightShow_${instanceId}`, after: 'depthCapture', before: 'render' }
  )

  //* Create cone geometry --
  // Open-ended cylinder transformed to point along Z axis
  const geom = React.useMemo(() => {
    const geometry = new CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true)
    geometry.applyMatrix4(new Matrix4().makeTranslation(0, -distance / 2, 0))
    geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
    return geometry
  }, [distance, radiusTop, radiusBottom])

  return <mesh ref={mesh} geometry={geom} material={material} raycast={() => null} />
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

          <spotLight ref={spotlight} angle={angle} color={color} distance={distance} castShadow {...props}>
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

          {children}
        </group>
      )
    }
  )
