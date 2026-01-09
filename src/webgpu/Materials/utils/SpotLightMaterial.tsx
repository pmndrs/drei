//* SpotLightMaterial - TSL WebGPU Implementation ==============================
// Volumetric spotlight cone effect with distance attenuation and optional soft depth edges
// Used by SpotLight component to render light cone geometry

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec3,
  vec4,
  float,
  texture,
  positionWorld,
  positionView,
  normalLocal,
  modelViewMatrix,
  dot,
  pow,
  distance,
  saturate,
  smoothstep,
  screenCoordinate,
  screenSize,
  abs,
  select,
  varying,
  normalize,
} from 'three/tsl'

//* SpotLightMaterial ==============================
// Creates a volumetric cone effect for spotlights
// - Distance-based attenuation from spotlight position
// - Angle-based intensity falloff (anglePower)
// - Optional soft edges when intersecting geometry (depth buffer)

export class SpotLightMaterial extends MeshBasicNodeMaterial {
  // Private uniform nodes
  private _depth: THREE.TextureNode
  private _opacity: THREE.UniformNode<number>
  private _attenuation: THREE.UniformNode<number>
  private _anglePower: THREE.UniformNode<number>
  private _spotPosition: THREE.UniformNode<THREE.Vector3>
  private _lightColor: THREE.UniformNode<THREE.Color>
  private _cameraNear: THREE.UniformNode<number>
  private _cameraFar: THREE.UniformNode<number>
  private _resolution: THREE.UniformNode<THREE.Vector2>

  constructor() {
    super()

    //* Initialize Uniforms --
    this._depth = uniformTexture(new THREE.Texture())
    this._opacity = uniform(1)
    this._attenuation = uniform(2.5)
    this._anglePower = uniform(12)
    this._spotPosition = uniform(new THREE.Vector3(0, 0, 0))
    this._lightColor = uniform(new THREE.Color('white'))
    this._cameraNear = uniform(0)
    this._cameraFar = uniform(1)
    this._resolution = uniform(new THREE.Vector2(0, 0))

    //* Material Properties --
    this.transparent = true
    this.depthWrite = false
    this.side = THREE.FrontSide  // Match legacy default
    // Use default NormalBlending - alpha controls transparency

    this._buildShader()
  }

  private _buildShader() {
    // Capture uniforms for closure
    const depthTex = this._depth
    const opacityUniform = this._opacity
    const attenuationUniform = this._attenuation
    const anglePowerUniform = this._anglePower
    const spotPositionUniform = this._spotPosition
    const lightColorUniform = this._lightColor
    const cameraNearUniform = this._cameraNear
    const cameraFarUniform = this._cameraFar
    const resolutionUniform = this._resolution

    //* Vertex Data (computed as varyings) --
    // Transform local normal to view space (matches legacy: normalMatrix * normal)
    // modelViewMatrix's upper 3x3 transforms directions to view space
    const viewSpaceNormal = normalize(modelViewMatrix.mul(vec4(normalLocal, 0.0)).xyz)
    const vNormal = varying(viewSpaceNormal, 'vNormal')

    // Compute intensity based on distance from spotlight position
    const vIntensity = varying(
      Fn(() => {
        const worldPos = positionWorld
        const dist = distance(worldPos, spotPositionUniform)
        return saturate(float(1.0).sub(dist.div(attenuationUniform)))
      })(),
      'vIntensity'
    )

    // View-space Z for depth comparison
    const vViewZ = varying(positionView.z, 'vViewZ')

    //* Helper: Linearize depth value --
    // Converts normalized depth [0,1] to linear [0,1] range
    const linearizeDepth = Fn(([depthVal, near, far]: [any, any, any]) => {
      // For perspective projection: linear = near / (far - depth * (far - near))
      return near.div(far.sub(depthVal.mul(far.sub(near))))
    })

    //* Helper: Read depth buffer --
    const readDepth = Fn(([depthSampler, sampleUv]: [any, any]) => {
      return texture(depthSampler, sampleUv).r
    })

    //* Fragment Shader --
    this.colorNode = Fn(() => {
      // Match legacy GLSL exactly:
      // vec3 normal = vec3(vNormal.x, vNormal.y, abs(vNormal.z));
      // float angleIntensity = pow(dot(normal, vec3(0, 0, 1)), anglePower);
      const normal = vec3(vNormal.x, vNormal.y, abs(vNormal.z))
      
      // dot(normal, vec3(0,0,1)) is just normal.z which is abs(vNormal.z)
      const angleIntensity = pow(abs(vNormal.z), anglePowerUniform)
      
      // Combine distance and angle
      const intensity = vIntensity.mul(angleIntensity).toVar()
      
      //* Soft Edges (depth buffer intersection) --
      // TODO: Currently disabled for debugging - enable once depth buffer works
      // The depth buffer soft edges will fade the cone where it intersects geometry
      
      // For now, skip soft edges entirely to keep cones visible
      // intensity.assign(select(hasDepth, intensity.mul(softFactor), intensity))
      
      //* Final Output --
      return vec4(lightColorUniform, intensity.mul(opacityUniform))
    })()
  }

  //* Uniform Accessors ==============================
  // Note: Setters guard against undefined because super() may call them before uniforms are initialized

  get depth() {
    return this._depth?.value as THREE.Texture
  }
  set depth(v: THREE.Texture | null) {
    if (this._depth) this._depth.value = v ?? new THREE.Texture()
  }

  get opacity() {
    return this._opacity?.value as number
  }
  set opacity(v: number) {
    if (this._opacity) this._opacity.value = v
  }

  get attenuation() {
    return this._attenuation?.value as number
  }
  set attenuation(v: number) {
    if (this._attenuation) this._attenuation.value = v
  }

  get anglePower() {
    return this._anglePower?.value as number
  }
  set anglePower(v: number) {
    if (this._anglePower) this._anglePower.value = v
  }

  get spotPosition() {
    return this._spotPosition?.value as THREE.Vector3
  }
  set spotPosition(v: THREE.Vector3) {
    if (this._spotPosition) this._spotPosition.value = v
  }

  get lightColor() {
    return this._lightColor?.value as THREE.Color
  }
  set lightColor(v: THREE.Color) {
    if (this._lightColor) this._lightColor.value = v
  }

  get cameraNear() {
    return this._cameraNear?.value as number
  }
  set cameraNear(v: number) {
    if (this._cameraNear) this._cameraNear.value = v
  }

  get cameraFar() {
    return this._cameraFar?.value as number
  }
  set cameraFar(v: number) {
    if (this._cameraFar) this._cameraFar.value = v
  }

  get resolution() {
    return this._resolution?.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2) {
    if (this._resolution) this._resolution.value = v
  }
}
