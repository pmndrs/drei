//* Caustics - TSL WebGPU Implementation ==============================
// Renders caustics from refractive objects onto receiving surfaces.
// Original Author: @N8Programs https://github.com/N8python/caustics
// TSL Conversion: drei webgpu migration

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial, MeshNormalNodeMaterial, QuadMesh, TextureNode, Renderer } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  uv,
  vec2,
  vec3,
  vec4,
  float,
  texture,
  positionWorld,
  normalWorld,
  normalize,
  cross,
  dot,
  length,
  refract,
  max,
  select,
  mul,
  add,
  sub,
  div,
  negate,
} from 'three/tsl'
import * as React from 'react'
import { extend, ReactThreeFiber, ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@core/Portal/Fbo'
import { useHelper } from '@core/Gizmos/useHelper'
import { Edges } from '@core/Geometry/Edges'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type CausticsProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it will render, set it to Infinity for runtime, default: 1 */
  frames?: number
  /** Enables visual cues to help you stage your scene, default: false */
  debug?: boolean
  /** Will display caustics only and skip the models, default: false */
  causticsOnly: boolean
  /** Will include back faces and enable the backsideIOR prop, default: false */
  backside: boolean
  /** The IOR refraction index, default: 1.1 */
  ior?: number
  /** The IOR refraction index for back faces (only available when backside is enabled), default: 1.1 */
  backsideIOR?: number
  /** The texel size, default: 0.3125 */
  worldRadius?: number
  /** Intensity of the projected caustics, default: 0.05 */
  intensity?: number
  /** Caustics color, default: white */
  color?: ReactThreeFiber.Color
  /** Buffer resolution, default: 2048 */
  resolution?: number
  /** Camera position, it will point towards the contents bounds center, default: [5, 5, 5] */
  lightSource?: [x: number, y: number, z: number] | React.RefObject<THREE.Object3D>
}

//* CausticsProjectionMaterial ==============================
// Projects pre-computed caustics textures onto receiving geometry
// Samples two caustics textures (front/back faces) and combines with color

export class CausticsProjectionMaterial extends MeshBasicNodeMaterial {
  private _causticsTexture: TextureNode
  private _causticsTextureB: TextureNode
  private _color: THREE.UniformNode<THREE.Color>
  private _lightProjMatrix: THREE.UniformNode<THREE.Matrix4>
  private _lightViewMatrix: THREE.UniformNode<THREE.Matrix4>

  constructor() {
    super()

    // Initialize uniforms - use uniformTexture for textures that will be updated
    this._causticsTexture = uniformTexture(new THREE.Texture())
    this._causticsTextureB = uniformTexture(new THREE.Texture())
    this._color = uniform(new THREE.Color(1, 1, 1))
    this._lightProjMatrix = uniform(new THREE.Matrix4())
    this._lightViewMatrix = uniform(new THREE.Matrix4())

    // Blending setup for additive caustics
    this.transparent = true
    this.blending = THREE.CustomBlending
    this.blendSrc = THREE.OneFactor
    this.blendDst = THREE.SrcAlphaFactor
    this.depthWrite = false

    this._buildShader()
  }

  private _buildShader() {
    const causticsTexture = this._causticsTexture
    const causticsTextureB = this._causticsTextureB
    const colorUniform = this._color
    const lightProjMatrix = this._lightProjMatrix
    const lightViewMatrix = this._lightViewMatrix

    // Fragment: Project world position into light space, sample caustics
    this.colorNode = Fn(() => {
      // Get world position (TSL built-in)
      const worldPos = positionWorld

      // Transform to light space: lightProjMatrix * lightViewMatrix * vec4(worldPos, 1.0)
      const worldPos4 = vec4(worldPos, 1.0)
      const lightSpacePos = mul(lightProjMatrix, mul(lightViewMatrix, worldPos4)).toVar()

      // Perspective divide
      const xyz = lightSpacePos.xyz.div(lightSpacePos.w)

      // Convert from NDC [-1,1] to UV [0,1]
      const lightUv = xyz.mul(0.5).add(0.5).xy

      // Sample front and back caustics textures
      const front = texture(causticsTexture, lightUv).rgb
      const back = texture(causticsTextureB, lightUv).rgb

      // Combine caustics with color
      return vec4(add(front, back).mul(colorUniform), 1.0)
    })()
  }

  //* Uniform Accessors ==============================

  get causticsTexture() {
    return this._causticsTexture.value as THREE.Texture
  }
  set causticsTexture(v: THREE.Texture) {
    this._causticsTexture.value = v
  }

  get causticsTextureB() {
    return this._causticsTextureB.value as THREE.Texture
  }
  set causticsTextureB(v: THREE.Texture) {
    this._causticsTextureB.value = v
  }

  get color() {
    return this._color.value as THREE.Color
  }
  set color(v: THREE.Color) {
    this._color.value = v
  }

  get lightProjMatrix() {
    return this._lightProjMatrix.value as THREE.Matrix4
  }
  set lightProjMatrix(v: THREE.Matrix4) {
    this._lightProjMatrix.value = v
  }

  get lightViewMatrix() {
    return this._lightViewMatrix.value as THREE.Matrix4
  }
  set lightViewMatrix(v: THREE.Matrix4) {
    this._lightViewMatrix.value = v
  }
}

//* CausticsMaterial ==============================
// Computes caustics intensity via ray refraction through surface normals.
// Uses depth buffer reconstruction and area ratio calculation for intensity.

export class CausticsMaterial extends MeshBasicNodeMaterial {
  private _cameraMatrixWorld: THREE.UniformNode<THREE.Matrix4>
  private _cameraProjectionMatrixInv: THREE.UniformNode<THREE.Matrix4>
  private _normalTexture: TextureNode
  private _depthTexture: TextureNode
  private _lightDir: THREE.UniformNode<THREE.Vector3>
  private _lightPlaneNormal: THREE.UniformNode<THREE.Vector3>
  private _lightPlaneConstant: THREE.UniformNode<number>
  private _near: THREE.UniformNode<number>
  private _far: THREE.UniformNode<number>
  private _worldRadius: THREE.UniformNode<number>
  private _ior: THREE.UniformNode<number>
  private _resolution: THREE.UniformNode<number>
  private _size: THREE.UniformNode<number>
  private _intensity: THREE.UniformNode<number>

  constructor() {
    super()

    // Initialize all uniforms - use uniformTexture for textures that will be updated
    this._cameraMatrixWorld = uniform(new THREE.Matrix4())
    this._cameraProjectionMatrixInv = uniform(new THREE.Matrix4())
    this._normalTexture = uniformTexture(new THREE.Texture())
    this._depthTexture = uniformTexture(new THREE.Texture())
    this._lightDir = uniform(new THREE.Vector3(0, 1, 0))
    this._lightPlaneNormal = uniform(new THREE.Vector3(0, 1, 0))
    this._lightPlaneConstant = uniform(0)
    this._near = uniform(0.1)
    this._far = uniform(100)
    this._worldRadius = uniform(1 / 40)
    this._ior = uniform(1.1)
    this._resolution = uniform(1024)
    this._size = uniform(10)
    this._intensity = uniform(0.5)

    this._buildShader()
  }

  private _buildShader() {
    // Capture uniforms for closure
    const cameraMatrixWorld = this._cameraMatrixWorld
    const cameraProjectionMatrixInv = this._cameraProjectionMatrixInv
    const normalTexture = this._normalTexture
    const depthTexture = this._depthTexture
    const lightDir = this._lightDir
    const lightPlaneNormal = this._lightPlaneNormal
    const lightPlaneConstant = this._lightPlaneConstant
    const worldRadius = this._worldRadius
    const ior = this._ior
    const resolution = this._resolution
    const size = this._size
    const intensity = this._intensity

    //* Helper: Reconstruct world position from depth --
    const worldPosFromDepth = Fn(([depth, coord]: [any, any]) => {
      // Convert depth to NDC z: z = depth * 2.0 - 1.0
      const z = depth.mul(2.0).sub(1.0)

      // Create clip space position
      const clipSpacePos = vec4(coord.mul(2.0).sub(1.0), z, 1.0)

      // Transform to view space
      const viewSpacePos = mul(cameraProjectionMatrixInv, clipSpacePos).toVar()
      viewSpacePos.assign(viewSpacePos.div(viewSpacePos.w)) // Perspective divide

      // Transform to world space
      const worldSpacePos = mul(cameraMatrixWorld, viewSpacePos)
      return worldSpacePos.xyz
    })

    //* Helper: Ray-plane intersection --
    // Returns t where intersection = ro + rd * t
    // t = -(dot(ro, n) + d) / dot(rd, n)
    const planeIntersect = Fn(([ro, rd, planeN, planeD]: [any, any, any, any]) => {
      return negate(add(dot(ro, planeN), planeD)).div(dot(rd, planeN))
    })

    //* Helper: Compute refracted ray --
    const computeRefractedRay = Fn(
      ([originPos, lightD, surfacePos, surfaceNormal, iorVal]: [any, any, any, any, any]) => {
        // Refract light direction through surface
        const rayDir = refract(lightD, surfaceNormal, div(float(1.0), iorVal))
        // Offset origin slightly along refracted direction to avoid self-intersection
        const rayOrigin = add(surfacePos, mul(rayDir, 0.1))
        return vec4(rayOrigin, 0.0).setW(float(0.0)) // Pack origin, we'll compute dir separately
      }
    )

    //* Main Fragment Shader --
    this.colorNode = Fn(() => {
      const baseUv = uv()

      // Sample center depth for early-out check
      const centerDepth = texture(depthTexture, baseUv).x

      // Calculate sample radius based on world radius and resolution
      // causticTexelSize = (1.0 / resolution) * size * 2.0
      const causticTexelSize = div(float(1.0), resolution).mul(size).mul(2.0)
      const texelsNeeded = div(worldRadius, causticTexelSize)
      const sampleRadius = div(texelsNeeded, resolution)

      // Four corner sample offsets (fixed pattern, could be randomized)
      const offset1 = vec2(-0.5, -0.5)
      const offset2 = vec2(-0.5, 0.5)
      const offset3 = vec2(0.5, 0.5)
      const offset4 = vec2(0.5, -0.5)

      // Compute sample UVs
      const uv1 = add(baseUv, mul(offset1, sampleRadius))
      const uv2 = add(baseUv, mul(offset2, sampleRadius))
      const uv3 = add(baseUv, mul(offset3, sampleRadius))
      const uv4 = add(baseUv, mul(offset4, sampleRadius))

      // Sample normals and convert from [0,1] to [-1,1]
      const normal1 = sub(mul(texture(normalTexture, uv1).rgb, 2.0), 1.0)
      const normal2 = sub(mul(texture(normalTexture, uv2).rgb, 2.0), 1.0)
      const normal3 = sub(mul(texture(normalTexture, uv3).rgb, 2.0), 1.0)
      const normal4 = sub(mul(texture(normalTexture, uv4).rgb, 2.0), 1.0)

      // Sample depths
      const depth1 = texture(depthTexture, uv1).x
      const depth2 = texture(depthTexture, uv2).x
      const depth3 = texture(depthTexture, uv3).x
      const depth4 = texture(depthTexture, uv4).x

      // Reconstruct world positions from depth
      const pos1 = worldPosFromDepth(depth1, uv1)
      const pos2 = worldPosFromDepth(depth2, uv2)
      const pos3 = worldPosFromDepth(depth3, uv3)
      const pos4 = worldPosFromDepth(depth4, uv4)

      // Get origin positions (at depth = 0, i.e., on the near plane)
      const originPos1 = worldPosFromDepth(float(0.0), uv1)
      const originPos2 = worldPosFromDepth(float(0.0), uv2)
      const originPos3 = worldPosFromDepth(float(0.0), uv3)
      const originPos4 = worldPosFromDepth(float(0.0), uv4)

      // Compute refracted ray directions
      const rayDir1 = refract(lightDir, normal1, div(float(1.0), ior))
      const rayDir2 = refract(lightDir, normal2, div(float(1.0), ior))
      const rayDir3 = refract(lightDir, normal3, div(float(1.0), ior))
      const rayDir4 = refract(lightDir, normal4, div(float(1.0), ior))

      // Offset ray origins along refracted direction
      const endPos1 = add(pos1, mul(rayDir1, 0.1))
      const endPos2 = add(pos2, mul(rayDir2, 0.1))
      const endPos3 = add(pos3, mul(rayDir3, 0.1))
      const endPos4 = add(pos4, mul(rayDir4, 0.1))

      // Calculate area of the quad in light space (before refraction)
      // Area = |cross(v2-v1, v3-v1)| + |cross(v3-v1, v4-v1)|
      const lightPosArea = add(
        length(cross(sub(originPos2, originPos1), sub(originPos3, originPos1))),
        length(cross(sub(originPos3, originPos1), sub(originPos4, originPos1)))
      )

      // Find where refracted rays intersect the light plane
      const t1 = planeIntersect(endPos1, rayDir1, lightPlaneNormal, lightPlaneConstant)
      const t2 = planeIntersect(endPos2, rayDir2, lightPlaneNormal, lightPlaneConstant)
      const t3 = planeIntersect(endPos3, rayDir3, lightPlaneNormal, lightPlaneConstant)
      const t4 = planeIntersect(endPos4, rayDir4, lightPlaneNormal, lightPlaneConstant)

      // Final positions on the receiving plane
      const finalPos1 = add(endPos1, mul(rayDir1, t1))
      const finalPos2 = add(endPos2, mul(rayDir2, t2))
      const finalPos3 = add(endPos3, mul(rayDir3, t3))
      const finalPos4 = add(endPos4, mul(rayDir4, t4))

      // Calculate final area (after refraction)
      const finalArea = add(
        length(cross(sub(finalPos2, finalPos1), sub(finalPos3, finalPos1))),
        length(cross(sub(finalPos3, finalPos1), sub(finalPos4, finalPos1)))
      )

      // Caustic intensity = ratio of areas * intensity factor
      // Smaller final area = more concentrated light = brighter caustics
      const caustic = mul(intensity, div(lightPosArea, finalArea))

      // Check for invalid samples (depth == 1.0 means background/sky)
      const isInvalid = centerDepth
        .equal(1.0)
        .or(depth1.equal(1.0))
        .or(depth2.equal(1.0))
        .or(depth3.equal(1.0))
        .or(depth4.equal(1.0))

      // Return black for invalid pixels, otherwise clamped caustic value
      const finalCaustic = select(isInvalid, float(0.0), max(caustic, float(0.0)))

      return vec4(vec3(finalCaustic), 1.0)
    })()
  }

  //* Uniform Accessors ==============================

  get cameraMatrixWorld() {
    return this._cameraMatrixWorld.value as THREE.Matrix4
  }
  set cameraMatrixWorld(v: THREE.Matrix4) {
    this._cameraMatrixWorld.value = v
  }

  get cameraProjectionMatrixInv() {
    return this._cameraProjectionMatrixInv.value as THREE.Matrix4
  }
  set cameraProjectionMatrixInv(v: THREE.Matrix4) {
    this._cameraProjectionMatrixInv.value = v
  }

  get normalTexture() {
    return this._normalTexture.value as THREE.Texture
  }
  set normalTexture(v: THREE.Texture | null) {
    this._normalTexture.value = v ?? new THREE.Texture()
  }

  get depthTexture() {
    return this._depthTexture.value as THREE.Texture
  }
  set depthTexture(v: THREE.Texture | null) {
    this._depthTexture.value = v ?? new THREE.Texture()
  }

  get lightDir() {
    return this._lightDir.value as THREE.Vector3
  }
  set lightDir(v: THREE.Vector3) {
    this._lightDir.value = v
  }

  get lightPlaneNormal() {
    return this._lightPlaneNormal.value as THREE.Vector3
  }
  set lightPlaneNormal(v: THREE.Vector3) {
    this._lightPlaneNormal.value = v
  }

  get lightPlaneConstant() {
    return this._lightPlaneConstant.value as number
  }
  set lightPlaneConstant(v: number) {
    this._lightPlaneConstant.value = v
  }

  get near() {
    return this._near.value as number
  }
  set near(v: number) {
    this._near.value = v
  }

  get far() {
    return this._far.value as number
  }
  set far(v: number) {
    this._far.value = v
  }

  get worldRadius() {
    return this._worldRadius.value as number
  }
  set worldRadius(v: number) {
    this._worldRadius.value = v
  }

  get ior() {
    return this._ior.value as number
  }
  set ior(v: number) {
    this._ior.value = v
  }

  get resolution() {
    return this._resolution.value as number
  }
  set resolution(v: number) {
    this._resolution.value = v
  }

  get size() {
    return this._size.value as number
  }
  set size(v: number) {
    this._size.value = v
  }

  get intensity() {
    return this._intensity.value as number
  }
  set intensity(v: number) {
    this._intensity.value = v
  }
}

//* CausticsNormalMaterial ==============================
// Modified MeshNormalMaterial that outputs normals in world space
// Used to render surface normals for caustics calculation

export class CausticsNormalMaterial extends MeshNormalNodeMaterial {
  constructor(side: THREE.Side = THREE.FrontSide) {
    super()
    this.side = side

    // Override normal output to transform to world space
    // Original GLSL: normal = inverseTransformDirection(normal, viewMatrix)
    // In TSL we can use normalWorld directly or transform normalView
    this.normalNode = Fn(() => {
      // normalWorld gives us the world-space normal directly
      return normalize(normalWorld)
    })()
  }
}

//* FBO Configuration ==============================

const NORMAL_FBO_PROPS = {
  depthBuffer: true,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  type: THREE.UnsignedByteType,
}

const CAUSTIC_FBO_PROPS = {
  minFilter: THREE.LinearMipmapLinearFilter,
  magFilter: THREE.LinearFilter,
  type: THREE.FloatType,
  generateMipmaps: true,
}

//* React Component ==============================

// Note: ThreeElements declaration is in legacy/Materials/Caustics
// extend() call below registers the material with R3F

export const Caustics: ForwardRefComponent<CausticsProps, THREE.Group> = /* @__PURE__ */ React.forwardRef(
  (
    {
      debug,
      children,
      frames = 1,
      ior = 1.1,
      color = 'white',
      causticsOnly = false,
      backside = false,
      backsideIOR = 1.1,
      worldRadius = 0.3125,
      intensity = 0.05,
      resolution = 2024,
      lightSource = [5, 5, 5],
      ...props
    }: CausticsProps,
    fref
  ) => {
    // Extend R3F with our custom material
    extend({ CausticsProjectionMaterial })

    const ref = React.useRef<THREE.Group>(null!)
    const camera = React.useRef<THREE.OrthographicCamera>(null!)
    const scene = React.useRef<THREE.Scene>(null!)
    const plane = React.useRef<THREE.Mesh<THREE.PlaneGeometry, CausticsProjectionMaterial>>(null!)
    const gl = useThree((state) => state.gl)
    const helper = useHelper(debug && camera, THREE.CameraHelper)

    // FBOs for front and back face normals/caustics
    const normalTarget = useFBO(resolution, resolution, NORMAL_FBO_PROPS)
    const normalTargetB = useFBO(resolution, resolution, NORMAL_FBO_PROPS)
    const causticsTarget = useFBO(resolution, resolution, CAUSTIC_FBO_PROPS)
    const causticsTargetB = useFBO(resolution, resolution, CAUSTIC_FBO_PROPS)

    // Normal materials for front and back faces
    const [normalMat] = React.useState(() => new CausticsNormalMaterial(THREE.FrontSide))
    const [normalMatB] = React.useState(() => new CausticsNormalMaterial(THREE.BackSide))

    // Caustics computation material and fullscreen quad
    const [causticsMaterial] = React.useState(() => new CausticsMaterial())
    const [causticsQuad] = React.useState(() => new QuadMesh(causticsMaterial))

    React.useLayoutEffect(() => {
      ref.current.updateWorldMatrix(false, true)
    })

    // Frame counter for limited rendering
    let count = 0

    // Reusable math objects (allocated once)
    const v = new THREE.Vector3()
    const lpF = new THREE.Frustum()
    const lpM = new THREE.Matrix4()
    const lpP = new THREE.Plane()

    const lightDir = new THREE.Vector3()
    const lightDirInv = new THREE.Vector3()
    const bounds = new THREE.Box3()
    const focusPos = new THREE.Vector3()

    const boundsVertices: THREE.Vector3[] = []
    const worldVerts: THREE.Vector3[] = []
    const projectedVerts: THREE.Vector3[] = []
    const lightDirs: THREE.Vector3[] = []

    const cameraPos = new THREE.Vector3()

    for (let i = 0; i < 8; i++) {
      boundsVertices.push(new THREE.Vector3())
      worldVerts.push(new THREE.Vector3())
      projectedVerts.push(new THREE.Vector3())
      lightDirs.push(new THREE.Vector3())
    }

    useFrame(() => {
      if (frames === Infinity || count++ < frames) {
        // Calculate light direction
        if (Array.isArray(lightSource)) lightDir.fromArray(lightSource).normalize()
        else lightDir.copy(ref.current.worldToLocal(lightSource.current!.getWorldPosition(v)).normalize())

        lightDirInv.copy(lightDir).multiplyScalar(-1)

        // Calculate bounds of the caustics scene
        scene.current.parent?.matrixWorld.identity()
        bounds.setFromObject(scene.current, true)

        // Get bounding box vertices
        boundsVertices[0].set(bounds.min.x, bounds.min.y, bounds.min.z)
        boundsVertices[1].set(bounds.min.x, bounds.min.y, bounds.max.z)
        boundsVertices[2].set(bounds.min.x, bounds.max.y, bounds.min.z)
        boundsVertices[3].set(bounds.min.x, bounds.max.y, bounds.max.z)
        boundsVertices[4].set(bounds.max.x, bounds.min.y, bounds.min.z)
        boundsVertices[5].set(bounds.max.x, bounds.min.y, bounds.max.z)
        boundsVertices[6].set(bounds.max.x, bounds.max.y, bounds.min.z)
        boundsVertices[7].set(bounds.max.x, bounds.max.y, bounds.max.z)

        for (let i = 0; i < 8; i++) {
          worldVerts[i].copy(boundsVertices[i])
        }

        bounds.getCenter(focusPos)
        boundsVertices.map((v) => v.sub(focusPos))
        const lightPlane = lpP.set(lightDirInv, 0)

        boundsVertices.map((v, i) => lightPlane.projectPoint(v, projectedVerts[i]))

        const centralVert = projectedVerts
          .reduce((a, b) => a.add(b), v.set(0, 0, 0))
          .divideScalar(projectedVerts.length)
        const radius = projectedVerts.map((v) => v.distanceTo(centralVert)).reduce((a, b) => Math.max(a, b))
        const dirLength = boundsVertices.map((x) => x.dot(lightDir)).reduce((a, b) => Math.max(a, b))

        // Setup orthographic camera for light-space rendering
        camera.current.position.copy(cameraPos.copy(lightDir).multiplyScalar(dirLength).add(focusPos))
        camera.current.lookAt(scene.current.localToWorld(focusPos))
        const dirMatrix = lpM.lookAt(camera.current.position, focusPos, v.set(0, 1, 0))
        camera.current.left = -radius
        camera.current.right = radius
        camera.current.top = radius
        camera.current.bottom = -radius
        const yOffset = v.set(0, radius, 0).applyMatrix4(dirMatrix)
        const yTime = (camera.current.position.y + yOffset.y) / lightDir.y
        camera.current.near = 0.1
        camera.current.far = yTime
        camera.current.updateProjectionMatrix()
        camera.current.updateMatrixWorld()

        // Calculate ground plane size
        const groundProjectedCoords = worldVerts.map((v, i) =>
          v.add(lightDirs[i].copy(lightDir).multiplyScalar(-v.y / lightDir.y))
        )
        const centerPos = groundProjectedCoords
          .reduce((a, b) => a.add(b), v.set(0, 0, 0))
          .divideScalar(groundProjectedCoords.length)
        const maxSize =
          2 *
          groundProjectedCoords
            .map((v) => Math.hypot(v.x - centerPos.x, v.z - centerPos.z))
            .reduce((a, b) => Math.max(a, b))
        plane.current.scale.setScalar(maxSize)
        plane.current.position.copy(centerPos)

        if (debug) helper.current?.update()

        // Get light near plane for caustics calculation
        const dirLightNearPlane = lpF.setFromProjectionMatrix(
          lpM.multiplyMatrices(camera.current.projectionMatrix, camera.current.matrixWorldInverse)
        ).planes[4]

        // Update caustics material uniforms
        causticsMaterial.cameraMatrixWorld = camera.current.matrixWorld
        causticsMaterial.cameraProjectionMatrixInv = camera.current.projectionMatrixInverse
        causticsMaterial.lightDir = lightDirInv
        causticsMaterial.lightPlaneNormal = dirLightNearPlane.normal
        causticsMaterial.lightPlaneConstant = dirLightNearPlane.constant
        causticsMaterial.near = camera.current.near
        causticsMaterial.far = camera.current.far
        causticsMaterial.resolution = resolution
        causticsMaterial.size = radius
        causticsMaterial.intensity = intensity
        causticsMaterial.worldRadius = worldRadius

        // Enable scene for rendering
        scene.current.visible = true

        // Render front face normals
        gl.setRenderTarget(normalTarget)
        gl.clear()
        scene.current.overrideMaterial = normalMat
        gl.render(scene.current, camera.current)

        // Render back face normals (if enabled)
        gl.setRenderTarget(normalTargetB)
        gl.clear()
        if (backside) {
          scene.current.overrideMaterial = normalMatB
          gl.render(scene.current, camera.current)
        }

        scene.current.overrideMaterial = null

        // Render front face caustics
        causticsMaterial.ior = ior
        plane.current.material.lightProjMatrix = camera.current.projectionMatrix
        plane.current.material.lightViewMatrix = camera.current.matrixWorldInverse
        causticsMaterial.normalTexture = normalTarget.texture
        causticsMaterial.depthTexture = normalTarget.depthTexture
        gl.setRenderTarget(causticsTarget)
        gl.clear()
        // TODO: R3F v10 will have proper WebGPU renderer types
        causticsQuad.render(gl as unknown as Renderer)

        // Render back face caustics (if enabled)
        causticsMaterial.ior = backsideIOR
        causticsMaterial.normalTexture = normalTargetB.texture
        causticsMaterial.depthTexture = normalTargetB.depthTexture
        gl.setRenderTarget(causticsTargetB)
        gl.clear()
        // TODO: R3F v10 will have proper WebGPU renderer types
        if (backside) causticsQuad.render(gl as unknown as Renderer)

        // Reset render target
        gl.setRenderTarget(null)

        // Hide scene if only showing caustics
        if (causticsOnly) scene.current.visible = false
      }
    })

    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <group ref={ref} {...props}>
        <scene ref={scene}>
          <orthographicCamera ref={camera} up={[0, 1, 0]} />
          {children}
        </scene>
        <mesh renderOrder={2} ref={plane} rotation-x={-Math.PI / 2}>
          <planeGeometry />
          <causticsProjectionMaterial
            transparent
            color={color}
            causticsTexture={causticsTarget.texture}
            causticsTextureB={causticsTargetB.texture}
            blending={THREE.CustomBlending}
            blendSrc={THREE.OneFactor}
            blendDst={THREE.SrcAlphaFactor}
            depthWrite={false}
          />
          {debug && (
            <Edges>
              <lineBasicMaterial color="#ffff00" toneMapped={false} />
            </Edges>
          )}
        </mesh>
      </group>
    )
  }
)
