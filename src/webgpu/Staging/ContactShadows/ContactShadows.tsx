//* ContactShadows - WebGPU TSL Implementation ==============================
// The author of the original code is @mrdoob https://twitter.com/mrdoob
// https://threejs.org/examples/?q=con#webgl_shadow_contact
//
// TSL Conversion: Dennis Smolek
// This version uses TSL (Three Shading Language) for WebGPU compatibility
//
// TODO: KNOWN LIMITATIONS - Needs human rewrite:
// - Color prop is NOT functional (ignored) - legacy uses alpha blending with colored shadows,
//   this version uses MultiplyBlending on white background which only supports grayscale shadows
// - The proper fix requires getting transparent render targets working in WebGPU,
//   or implementing a different compositing approach for colored shadows

import * as React from 'react'
import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import { Fn, uniform, uniformTexture, texture, uv, vec4, vec3, vec2, float, depth } from 'three/tsl'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type ContactShadowsProps = Omit<ThreeElements['group'], 'ref' | 'scale'> & {
  /** Shadow opacity, default: 1 */
  opacity?: number
  /** Shadow plane width multiplier, default: 1 */
  width?: number
  /** Shadow plane height multiplier, default: 1 */
  height?: number
  /** Blur amount, default: 1 */
  blur?: number
  /** Shadow camera near plane, default: 0 */
  near?: number
  /** Shadow camera far plane, default: 10 */
  far?: number
  /** Apply additional blur pass for smoothing, default: true */
  smooth?: boolean
  /** Render target resolution, default: 512 */
  resolution?: number
  /** Number of frames to render (Infinity for continuous), default: Infinity */
  frames?: number
  /** Scale of the shadow plane, default: 10 */
  scale?: number | [x: number, y: number]
  /** Shadow color, default: '#000000' */
  color?: THREE.ColorRepresentation
  /** Whether to write to depth buffer, default: false */
  depthWrite?: boolean
}

//* TSL Depth Material ==============================
// Custom depth material that mimics MeshDepthMaterial behavior
// Uses manual camera matrix uniform since TSL's built-in nodes may be bound to wrong camera

class DepthNodeMaterial extends MeshBasicNodeMaterial {
  private _opacity: THREE.UniformNode<number>

  constructor(opacity: number = 1) {
    super()
    this._opacity = uniform(opacity)
    this.depthTest = false
    this.depthWrite = false
    this._buildShader()
  }

  private _buildShader() {
    const opacityUniform = this._opacity

    // Multiply blend: gray shadows on white background
    // opacity 1 -> gray 0.3 (70% darkening)
    // opacity 0 -> gray 1.0 (no darkening)
    // TODO: Color support needs proper implementation - current multiply blend
    // approach doesn't correctly support colored shadows
    this.colorNode = Fn(() => {
      const shadowStrength = opacityUniform.mul(0.7)
      const gray = float(1.0).sub(shadowStrength)
      return vec4(gray, gray, gray, 1.0)
    })()
  }

  set shadowOpacity(value: number) {
    this._opacity.value = value
  }
}

//* TSL Blur Material ==============================
// Gaussian blur material using TSL nodes

class BlurNodeMaterial extends MeshBasicNodeMaterial {
  private _inputTexture: ReturnType<typeof uniformTexture>
  private _blurAmount: THREE.UniformNode<number>
  private _direction: 'horizontal' | 'vertical'

  constructor(direction: 'horizontal' | 'vertical' = 'horizontal') {
    super()

    // Use uniformTexture for proper TSL texture handling
    this._inputTexture = uniformTexture(new THREE.Texture())
    this._blurAmount = uniform(0.0)
    this._direction = direction

    this.depthTest = false
    this.depthWrite = false

    this._buildShader()
  }

  private _buildShader() {
    const inputTex = this._inputTexture
    const blurAmountUniform = this._blurAmount
    const isHorizontal = this._direction === 'horizontal'

    // 9-tap Gaussian blur weights (from three blur shaders)
    const weights = [0.051, 0.0918, 0.12245, 0.1531, 0.1633, 0.1531, 0.12245, 0.0918, 0.051]

    this.colorNode = Fn(() => {
      const texCoord = uv()
      const result = vec4(0.0, 0.0, 0.0, 0.0).toVar()

      // Sample at 9 offsets with Gaussian weights
      for (let i = 0; i < 9; i++) {
        const offset = float(i - 4).mul(blurAmountUniform)
        const sampleUV = isHorizontal ? texCoord.add(vec2(offset, 0.0)) : texCoord.add(vec2(0.0, offset))

        // Sample texture using the uniformTexture node
        const sampledColor = texture(inputTex, sampleUV)
        result.addAssign(sampledColor.mul(weights[i]))
      }

      return result
    })()
  }

  set inputTexture(value: THREE.Texture) {
    this._inputTexture.value = value
  }

  set blurAmount(value: number) {
    this._blurAmount.value = value
  }
}

//* ContactShadows Component ==============================

/**
 * A contact shadow implementation with automatic blur using WebGPU TSL.
 * Renders a shadow plane beneath your objects without needing a light to cast shadows.
 *
 * @example Basic usage
 * ```jsx
 * <ContactShadows
 *   opacity={1}
 *   scale={10}
 *   blur={1}
 *   far={10}
 *   resolution={256}
 *   color="#000000"
 * />
 * ```
 *
 * @example Static shadows (limited frames)
 * ```jsx
 * <ContactShadows frames={1} />
 * ```
 */
export const ContactShadows: ForwardRefComponent<ContactShadowsProps, THREE.Group> = /* @__PURE__ */ React.forwardRef(
  (
    {
      scale = 10,
      frames = Infinity,
      opacity = 1,
      width = 1,
      height = 1,
      blur = 1,
      near = 0,
      far = 10,
      resolution = 512,
      smooth = true,
      color = '#000000',
      depthWrite = false,
      renderOrder,
      ...props
    },
    fref
  ) => {
    const ref = React.useRef<THREE.Group>(null!)
    const scene = useThree((state) => state.scene)
    const gl = useThree((state) => state.gl)
    const shadowCamera = React.useRef<THREE.OrthographicCamera>(null!)

    // Calculate actual dimensions based on scale
    const actualWidth = width * (Array.isArray(scale) ? scale[0] : scale || 1)
    const actualHeight = height * (Array.isArray(scale) ? scale[1] : scale || 1)

    // Create render targets and materials
    const [
      renderTarget,
      planeGeometry,
      depthMaterial,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial,
      renderTargetBlur,
    ] = React.useMemo(() => {
      // Render targets - WebGPU compatible with RGBA for transparency
      const renderTarget = new THREE.RenderTarget(resolution, resolution, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
      })
      const renderTargetBlur = new THREE.RenderTarget(resolution, resolution, {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
      })
      renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false

      // Shadow plane geometry
      const planeGeometry = new THREE.PlaneGeometry(actualWidth, actualHeight).rotateX(Math.PI / 2)

      // Blur plane mesh
      const blurPlane = new THREE.Mesh(planeGeometry)
      blurPlane.visible = false

      // TSL depth material
      const depthMaterial = new DepthNodeMaterial(opacity)

      // TSL blur materials
      const horizontalBlurMaterial = new BlurNodeMaterial('horizontal')
      const verticalBlurMaterial = new BlurNodeMaterial('vertical')

      return [
        renderTarget,
        planeGeometry,
        depthMaterial,
        blurPlane,
        horizontalBlurMaterial,
        verticalBlurMaterial,
        renderTargetBlur,
      ]
    }, [resolution, actualWidth, actualHeight, color, near, far])

    // Blur shadows function
    const blurShadows = React.useCallback(
      (blurAmount: number) => {
        blurPlane.visible = true

        // Horizontal blur pass
        blurPlane.material = horizontalBlurMaterial
        horizontalBlurMaterial.inputTexture = renderTarget.texture
        horizontalBlurMaterial.blurAmount = blurAmount / 256

        gl.setRenderTarget(renderTargetBlur as any)
        gl.render(blurPlane, shadowCamera.current)

        // Vertical blur pass
        blurPlane.material = verticalBlurMaterial
        verticalBlurMaterial.inputTexture = renderTargetBlur.texture
        verticalBlurMaterial.blurAmount = blurAmount / 256

        gl.setRenderTarget(renderTarget as any)
        gl.render(blurPlane, shadowCamera.current)

        blurPlane.visible = false
      },
      [gl, blurPlane, horizontalBlurMaterial, verticalBlurMaterial, renderTarget, renderTargetBlur]
    )

    // Frame counter and state preservation
    let count = 0
    let initialBackground: THREE.Color | THREE.Texture | null
    let initialOverrideMaterial: THREE.Material | null

    useFrame(() => {
      if (shadowCamera.current && (frames === Infinity || count < frames)) {
        count++

        // Store initial scene state
        initialBackground = scene.background
        initialOverrideMaterial = scene.overrideMaterial

        // Hide shadow plane during capture
        ref.current.visible = false
        scene.background = null
        scene.overrideMaterial = depthMaterial

        // Render depth to shadow render target
        // Clear to WHITE (multiply blend: white = no change)
        gl.setRenderTarget(renderTarget as any)
        gl.setClearColor(0xffffff, 1)
        gl.clear(true, true, false)
        gl.render(scene, shadowCamera.current)

        // Apply blur passes
        blurShadows(blur)
        if (smooth) blurShadows(blur * 0.4)

        // Reset render target
        gl.setRenderTarget(null)

        // Restore scene state
        ref.current.visible = true
        scene.overrideMaterial = initialOverrideMaterial
        scene.background = initialBackground
      }
    })

    // Expose ref
    React.useImperativeHandle(fref, () => ref.current, [])

    // Sync opacity when prop changes
    React.useEffect(() => {
      depthMaterial.shadowOpacity = opacity
    }, [opacity, depthMaterial])

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        renderTarget.dispose()
        renderTargetBlur.dispose()
        planeGeometry.dispose()
        depthMaterial.dispose()
        horizontalBlurMaterial.dispose()
        verticalBlurMaterial.dispose()
      }
    }, [renderTarget, renderTargetBlur, planeGeometry, depthMaterial, horizontalBlurMaterial, verticalBlurMaterial])

    return (
      <group rotation-x={Math.PI / 2} {...props} ref={ref}>
        {/* Shadow display plane - multiply blend darkens ground where shadows are */}
        <mesh renderOrder={renderOrder} geometry={planeGeometry} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            map={renderTarget.texture}
            blending={THREE.MultiplyBlending}
            premultipliedAlpha
            depthWrite={depthWrite}
          />
        </mesh>

        {/* Shadow capture camera */}
        <orthographicCamera
          ref={shadowCamera}
          args={[-actualWidth / 2, actualWidth / 2, actualHeight / 2, -actualHeight / 2, near, far]}
        />
      </group>
    )
  }
)
