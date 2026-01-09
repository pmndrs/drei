//* MeshPortalMaterial - TSL WebGPU Implementation ==============================
// Portal material with SDF-based edge blur and scene blending
// Uses Jump Flood Algorithm for SDF generation
// Authors:
//   N8, https://twitter.com/N8Programs
//   drcmda, https://twitter.com/0xca0a
// https://github.com/N8python/maskBlur
// TSL Conversion: drei webgpu migration

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial, QuadMesh } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec2,
  vec4,
  float,
  texture,
  uv,
  screenCoordinate,
  screenSize,
  mix,
  smoothstep,
  clamp,
  round,
  floor,
  pow,
  distance,
  select,
  Loop,
  int,
} from 'three/tsl'
import * as React from 'react'
import { ReactThreeFiber, ThreeElements, extend, useFrame, useThree } from '@react-three/fiber'
import { useIntersect } from '@core/UI/useIntersect'
import { useFBO } from '@core/Portal/Fbo'
import { RenderTexture } from '@core/Portal/RenderTexture'
import { RenderTarget } from '#drei-platform'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type PortalProps = Omit<ThreeElements['meshBasicMaterial'], 'ref'> & {
  /** Mix the portals own scene with the world scene, 0 = world scene render,
   *  0.5 = both scenes render, 1 = portal scene renders, defaults to 0 */
  blend?: number
  /** Edge fade blur, 0 = no blur (default) */
  blur?: number
  /** SDF resolution, the smaller the faster is the start-up time (default: 512) */
  resolution?: number
  /** By default portals use relative coordinates, contents are affected by the local matrix transform */
  worldUnits?: boolean
  /** Optional event priority, defaults to 0 */
  eventPriority?: number
  /** Optional render priority, defaults to 0 */
  renderPriority?: number
  /** Optionally disable events inside the portal, defaults to false */
  events?: boolean
  /** Children will be rendered into the portal */
  children?: React.ReactNode
}

//* Portal Material (TSL) ==============================
// Blends portal texture with SDF-based alpha for smooth edges

class PortalMaterialImpl extends MeshBasicNodeMaterial {
  private _blur: THREE.UniformNode<number>
  private _map: THREE.TextureNode
  private _sdf: THREE.TextureNode
  private _blend: THREE.UniformNode<number>
  private _size: THREE.UniformNode<number>
  private _resolution: THREE.UniformNode<THREE.Vector2>

  constructor() {
    super()

    //* Initialize Uniforms --
    this._blur = uniform(0)
    this._map = uniformTexture(new THREE.Texture())
    this._sdf = uniformTexture(new THREE.Texture())
    this._blend = uniform(0)
    this._size = uniform(0)
    this._resolution = uniform(new THREE.Vector2())

    this._buildShader()
  }

  private _buildShader() {
    const blurUniform = this._blur
    const mapTex = this._map
    const sdfTex = this._sdf
    const sizeUniform = this._size
    const resolutionUniform = this._resolution

    this.colorNode = Fn(() => {
      // Screen UV from fragment coordinates
      const screenUv = screenCoordinate.xy.div(resolutionUniform)

      // Sample portal texture at screen UV
      const t = texture(mapTex, screenUv)

      // Sample SDF at mesh UV for edge detection
      const meshUv = uv()
      const d = texture(sdfTex, meshUv).r.div(sizeUniform)

      // Calculate alpha based on SDF distance and blur amount
      // alpha = 1 - smoothstep(0, 1, clamp(d/blur + 1, 0, 1))
      const k = blurUniform
      const edgeFactor = clamp(d.div(k).add(1.0), 0.0, 1.0)
      const alpha = float(1.0).sub(smoothstep(float(0.0), float(1.0), edgeFactor))

      // If blur is 0, use texture alpha directly; otherwise multiply by edge alpha
      const isBlurZero = k.equal(0.0)
      const finalAlpha = select(isBlurZero, t.a, t.a.mul(alpha))

      return vec4(t.rgb, finalAlpha)
    })()
  }

  //* Uniform Accessors --

  get blur() {
    return this._blur.value as number
  }
  set blur(v: number) {
    this._blur.value = v
  }

  get map() {
    return this._map.value as THREE.Texture
  }
  set map(v: THREE.Texture | null) {
    this._map.value = v ?? new THREE.Texture()
  }

  get sdf() {
    return this._sdf.value as THREE.Texture | null
  }
  set sdf(v: THREE.Texture | null) {
    if (v) this._sdf.value = v
  }

  get blend() {
    return this._blend.value as number
  }
  set blend(v: number) {
    this._blend.value = v
  }

  get size() {
    return this._size.value as number
  }
  set size(v: number) {
    this._size.value = v
  }

  get resolution() {
    return this._resolution.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2 | [number, number]) {
    if (Array.isArray(v)) this._resolution.value.set(v[0], v[1])
    else this._resolution.value.copy(v)
  }
}

//* Blend Material (TSL) ==============================
// Mixes two textures based on blend factor

class BlendMaterial extends MeshBasicNodeMaterial {
  private _textureA: THREE.TextureNode
  private _textureB: THREE.TextureNode
  private _blend: THREE.UniformNode<number>

  constructor() {
    super()

    this._textureA = uniformTexture(new THREE.Texture())
    this._textureB = uniformTexture(new THREE.Texture())
    this._blend = uniform(0)

    this._buildShader()
  }

  private _buildShader() {
    const texA = this._textureA
    const texB = this._textureB
    const blendUniform = this._blend

    this.colorNode = Fn(() => {
      const uvCoord = uv()
      const ta = texture(texA, uvCoord)
      const tb = texture(texB, uvCoord)
      return mix(tb, ta, blendUniform)
    })()
  }

  get textureA() {
    return this._textureA.value as THREE.Texture
  }
  set textureA(v: THREE.Texture) {
    this._textureA.value = v
  }

  get textureB() {
    return this._textureB.value as THREE.Texture
  }
  set textureB(v: THREE.Texture) {
    this._textureB.value = v
  }

  get blend() {
    return this._blend.value as number
  }
  set blend(v: number) {
    this._blend.value = v
  }
}

//* SDF Generator Materials (TSL) ==============================

// UV Render - packs UV coordinates based on mask
class UVRenderMaterial extends MeshBasicNodeMaterial {
  private _tex: THREE.TextureNode
  private _inside: THREE.UniformNode<number>

  constructor(inside = false) {
    super()
    this._tex = uniformTexture(new THREE.Texture())
    this._inside = uniform(inside ? 1.0 : 0.0)
    this._buildShader()
  }

  private _buildShader() {
    const tex = this._tex
    const insideUniform = this._inside

    this.colorNode = Fn(() => {
      const uvCoord = uv()
      const mask = texture(tex, uvCoord).x
      const roundedMask = round(mask)

      // For outside: uv * round(mask)
      // For inside: uv * (1 - round(mask))
      const isInside = insideUniform.greaterThan(0.5)
      const factor = select(isInside, float(1.0).sub(roundedMask), roundedMask)
      const packedUv = uvCoord.mul(factor)

      // Pack two half-floats into RGBA
      // This is a simplified version - actual packing would need more precision
      return vec4(packedUv.x, packedUv.y, 0.0, 1.0)
    })()
  }

  get tex() {
    return this._tex.value as THREE.Texture
  }
  set tex(v: THREE.Texture) {
    this._tex.value = v
  }
}

// Jump Flood Algorithm pass
class JumpFloodMaterial extends MeshBasicNodeMaterial {
  private _tex: THREE.TextureNode
  private _offset: THREE.UniformNode<number>
  private _texelSize: THREE.UniformNode<THREE.Vector2>

  constructor(clientWidth: number, clientHeight: number) {
    super()
    this._tex = uniformTexture(new THREE.Texture())
    this._offset = uniform(0)
    this._texelSize = uniform(new THREE.Vector2(1 / clientWidth, 1 / clientHeight))
    this._buildShader()
  }

  private _buildShader() {
    const tex = this._tex
    const offsetUniform = this._offset
    const texelSizeUniform = this._texelSize

    this.colorNode = Fn(() => {
      const uvCoord = uv()
      const closestDist = float(9999999.9).toVar()
      const closestPos = vec2(0.0, 0.0).toVar()

      // 3x3 neighbor search
      Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: x }) => {
        Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: y }) => {
          const sampleOffset = vec2(float(x), float(y)).mul(texelSizeUniform).mul(offsetUniform)
          const sampleUv = uvCoord.add(sampleOffset)
          const pos = texture(tex, sampleUv).xy

          const dist = distance(pos, uvCoord)
          const isValid = pos.x.notEqual(0.0).and(pos.y.notEqual(0.0))
          const isCloser = dist.lessThan(closestDist)

          // Update closest if valid and closer
          const shouldUpdate = isValid.and(isCloser)
          closestDist.assign(select(shouldUpdate, dist, closestDist))
          closestPos.assign(select(shouldUpdate, pos, closestPos))
        })
      })

      return vec4(closestPos, 0.0, 1.0)
    })()
  }

  get tex() {
    return this._tex.value as THREE.Texture
  }
  set tex(v: THREE.Texture) {
    this._tex.value = v
  }

  get offset() {
    return this._offset.value as number
  }
  set offset(v: number) {
    this._offset.value = v
  }
}

// Distance Field render - converts JFA output to distance
class DistanceFieldMaterial extends MeshBasicNodeMaterial {
  private _tex: THREE.TextureNode
  private _size: THREE.UniformNode<THREE.Vector2>

  constructor(clientWidth: number, clientHeight: number) {
    super()
    this._tex = uniformTexture(new THREE.Texture())
    this._size = uniform(new THREE.Vector2(clientWidth, clientHeight))
    this._buildShader()
  }

  private _buildShader() {
    const tex = this._tex
    const sizeUniform = this._size

    this.colorNode = Fn(() => {
      const uvCoord = uv()
      const pos = texture(tex, uvCoord).xy
      const dist = distance(sizeUniform.mul(pos), sizeUniform.mul(uvCoord))
      return vec4(dist, 0.0, 0.0, 1.0)
    })()
  }

  get tex() {
    return this._tex.value as THREE.Texture
  }
  set tex(v: THREE.Texture) {
    this._tex.value = v
  }
}

// Composite - combines inside/outside distance fields
class CompositeMaterial extends MeshBasicNodeMaterial {
  private _inside: THREE.TextureNode
  private _outside: THREE.TextureNode
  private _mask: THREE.TextureNode

  constructor() {
    super()
    this._inside = uniformTexture(new THREE.Texture())
    this._outside = uniformTexture(new THREE.Texture())
    this._mask = uniformTexture(new THREE.Texture())
    this._buildShader()
  }

  private _buildShader() {
    const insideTex = this._inside
    const outsideTex = this._outside
    const maskTex = this._mask

    this.colorNode = Fn(() => {
      const uvCoord = uv()
      const i = texture(insideTex, uvCoord).x
      const o = texture(outsideTex, uvCoord).x
      const maskVal = texture(maskTex, uvCoord).x

      // If mask is 0 (outside), use outside distance
      // Otherwise use negative inside distance
      const isOutside = maskVal.equal(0.0)
      const result = select(isOutside, o, i.negate())

      return vec4(result, 0.0, 0.0, 1.0)
    })()
  }

  get inside() {
    return this._inside.value as THREE.Texture
  }
  set inside(v: THREE.Texture) {
    this._inside.value = v
  }

  get outside() {
    return this._outside.value as THREE.Texture
  }
  set outside(v: THREE.Texture) {
    this._outside.value = v
  }

  get mask() {
    return this._mask.value as THREE.Texture
  }
  set mask(v: THREE.Texture) {
    this._mask.value = v
  }
}

//* SDF Generator Factory ==============================

const makeSDFGenerator = (clientWidth: number, clientHeight: number, renderer: THREE.WebGPURenderer) => {
  // Create render targets (platform-agnostic)
  const finalTarget = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.FloatType,
    format: THREE.RedFormat,
    generateMipmaps: true,
  })

  const outsideRenderTarget = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })

  const insideRenderTarget = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })

  const outsideRenderTarget2 = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })

  const insideRenderTarget2 = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  })

  const outsideRenderTargetFinal = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    format: THREE.RedFormat,
  })

  const insideRenderTargetFinal = new RenderTarget(clientWidth, clientHeight, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    format: THREE.RedFormat,
  })

  // Create materials
  const uvRenderMat = new UVRenderMaterial(false)
  const uvRenderInsideMat = new UVRenderMaterial(true)
  const jumpFloodMat = new JumpFloodMaterial(clientWidth, clientHeight)
  const distanceFieldMat = new DistanceFieldMaterial(clientWidth, clientHeight)
  const compositeMat = new CompositeMaterial()

  // Create quads
  const uvRenderQuad = new QuadMesh(uvRenderMat)
  const uvRenderInsideQuad = new QuadMesh(uvRenderInsideMat)
  const jumpFloodQuad = new QuadMesh(jumpFloodMat)
  const distanceFieldQuad = new QuadMesh(distanceFieldMat)
  const compositeQuad = new QuadMesh(compositeMat)

  return (image: THREE.Texture) => {
    image.minFilter = THREE.NearestFilter
    image.magFilter = THREE.NearestFilter

    // Render outside UV
    uvRenderMat.tex = image
    renderer.setRenderTarget(outsideRenderTarget)
    uvRenderQuad.render(renderer)

    // Jump Flood passes for outside
    const passes = Math.ceil(Math.log(Math.max(clientWidth, clientHeight)) / Math.log(2.0))
    let lastTarget: InstanceType<typeof RenderTarget> = outsideRenderTarget
    let target: InstanceType<typeof RenderTarget>

    for (let i = 0; i < passes; i++) {
      const offset = Math.pow(2, passes - i - 1)
      target = lastTarget === outsideRenderTarget ? outsideRenderTarget2 : outsideRenderTarget
      jumpFloodMat.offset = offset
      jumpFloodMat.tex = lastTarget.texture as THREE.Texture
      renderer.setRenderTarget(target as any)
      jumpFloodQuad.render(renderer)
      lastTarget = target
    }

    // Distance field for outside
    renderer.setRenderTarget(outsideRenderTargetFinal as any)
    distanceFieldMat.tex = target!.texture as THREE.Texture
    distanceFieldQuad.render(renderer)

    // Render inside UV
    uvRenderInsideMat.tex = image
    renderer.setRenderTarget(insideRenderTarget)
    uvRenderInsideQuad.render(renderer)

    // Jump Flood passes for inside
    lastTarget = insideRenderTarget as InstanceType<typeof RenderTarget>
    for (let i = 0; i < passes; i++) {
      const offset = Math.pow(2, passes - i - 1)
      target = lastTarget === insideRenderTarget ? insideRenderTarget2 : insideRenderTarget
      jumpFloodMat.offset = offset
      jumpFloodMat.tex = lastTarget.texture as THREE.Texture
      renderer.setRenderTarget(target as any)
      jumpFloodQuad.render(renderer)
      lastTarget = target
    }

    // Distance field for inside
    renderer.setRenderTarget(insideRenderTargetFinal as any)
    distanceFieldMat.tex = target!.texture as THREE.Texture
    distanceFieldQuad.render(renderer)

    // Composite
    renderer.setRenderTarget(finalTarget)
    compositeMat.inside = insideRenderTargetFinal.texture
    compositeMat.outside = outsideRenderTargetFinal.texture
    compositeMat.mask = image
    compositeQuad.render(renderer)

    renderer.setRenderTarget(null)
    return finalTarget
  }
}

//* MeshPortalMaterial Component ==============================

//* Module Augmentation ==============================
// Note: portalMaterialImpl is extended at runtime via extend()
// Type definition is minimal to avoid conflicts with legacy material

export const MeshPortalMaterial: ForwardRefComponent<PortalProps, PortalMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        children,
        events = undefined,
        blur = 0,
        eventPriority = 0,
        renderPriority = 0,
        worldUnits = false,
        resolution = 512,
        ...props
      },
      fref
    ) => {
      extend({ PortalMaterialImpl })

      const ref = React.useRef<PortalMaterialImpl>(null!)
      const { scene, gl, size, viewport, setEvents } = useThree()
      const maskRenderTarget = useFBO(resolution, resolution)

      const [priority, setPriority] = React.useState(0)
      useFrame(() => {
        // If blend is > 0 then the portal is being entered, the render-priority must change
        const p = ref.current.blend > 0 ? Math.max(1, renderPriority) : 0
        if (priority !== p) setPriority(p)
      })

      React.useEffect(() => {
        if (events !== undefined) setEvents({ enabled: !events })
      }, [events])

      const [visible, setVisible] = React.useState(true)
      // See if the parent mesh is in the camera frustum
      const parent = useIntersect(setVisible) as React.RefObject<THREE.Mesh<THREE.BufferGeometry>>
      React.useLayoutEffect(() => {
        // Since the ref above is not tied to a mesh directly (we're inside a material),
        // it has to be tied to the parent mesh here
        parent.current = (ref.current as any)?.__r3f?.parent?.object
      }, [])

      React.useLayoutEffect(() => {
        if (!parent.current) return

        // Apply the SDF mask only once
        if (blur && ref.current.sdf === null) {
          const tempMesh = new THREE.Mesh(parent.current.geometry, new THREE.MeshBasicMaterial())
          const boundingBox = new THREE.Box3().setFromBufferAttribute(
            tempMesh.geometry.attributes.position as THREE.BufferAttribute
          )
          const orthoCam = new THREE.OrthographicCamera(
            boundingBox.min.x * (1 + 2 / resolution),
            boundingBox.max.x * (1 + 2 / resolution),
            boundingBox.max.y * (1 + 2 / resolution),
            boundingBox.min.y * (1 + 2 / resolution),
            0.1,
            1000
          )
          orthoCam.position.set(0, 0, 1)
          orthoCam.lookAt(0, 0, 0)

          gl.setRenderTarget(maskRenderTarget)
          gl.render(tempMesh, orthoCam)
          const sg = makeSDFGenerator(resolution, resolution, gl as unknown as THREE.WebGPURenderer)
          const sdf = sg(maskRenderTarget.texture)
          const readSdf = new Float32Array(resolution * resolution)
          gl.readRenderTargetPixels(sdf, 0, 0, resolution, resolution, readSdf)

          // Get smallest value in SDF
          let min = Infinity
          for (let i = 0; i < readSdf.length; i++) {
            if (readSdf[i] < min) min = readSdf[i]
          }
          min = -min
          ref.current.size = min
          ref.current.sdf = sdf.texture

          gl.setRenderTarget(null)
        }
      }, [resolution, blur])

      React.useImperativeHandle(fref, () => ref.current)

      const compute = React.useCallback(
        (event: any, state: any, _previous: any) => {
          if (!parent.current) return false
          state.pointer.set((event.offsetX / state.size.width) * 2 - 1, -(event.offsetY / state.size.height) * 2 + 1)
          state.raycaster.setFromCamera(state.pointer, state.camera)

          if (ref.current?.blend === 0) {
            // We run a quick check against the parent, if it isn't hit there's no need to raycast at all
            const [intersection] = state.raycaster.intersectObject(parent.current)
            if (!intersection) {
              // Cancel out the raycast camera if the parent mesh isn't hit
              state.raycaster.camera = undefined
              return false
            }
          }
        },
        [parent]
      )

      return (
        // @ts-ignore - portalMaterialImpl is dynamically extended, type conflicts with legacy
        <portalMaterialImpl
          ref={ref}
          blur={blur}
          blend={0}
          resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
          attach="material"
          {...props}
        >
          <RenderTexture
            attach="map"
            frames={visible ? Infinity : 0}
            eventPriority={eventPriority}
            renderPriority={renderPriority}
            compute={compute}
          >
            {children}
            <ManagePortalScene
              events={events}
              rootScene={scene}
              priority={priority}
              material={ref}
              worldUnits={worldUnits}
            />
          </RenderTexture>
        </portalMaterialImpl>
      )
    }
  )

//* ManagePortalScene ==============================

function ManagePortalScene({
  events = undefined,
  rootScene,
  material,
  priority,
  worldUnits,
}: {
  events?: boolean
  rootScene: THREE.Scene
  material: React.RefObject<PortalMaterialImpl>
  priority: number
  worldUnits: boolean
}) {
  const scene = useThree((state) => state.scene)
  const setEvents = useThree((state) => state.setEvents)
  const buffer1 = useFBO()
  const buffer2 = useFBO()

  React.useLayoutEffect(() => {
    scene.matrixAutoUpdate = false
  }, [])

  React.useEffect(() => {
    if (events !== undefined) setEvents({ enabled: events })
  }, [events])

  // Create blend material and quad
  const [quad, blendMat] = React.useMemo(() => {
    const mat = new BlendMaterial()
    mat.textureA = buffer1.texture
    mat.textureB = buffer2.texture
    const q = new QuadMesh(mat)
    return [q, mat]
  }, [buffer1.texture, buffer2.texture])

  useFrame((state) => {
    const parent = (material?.current as any)?.__r3f?.parent?.object
    if (parent) {
      // Move portal contents along with the parent if worldUnits is true
      if (!worldUnits) {
        // If the portal renders exclusively the original scene needs to be updated
        if (priority && material.current?.blend === 1) parent.updateWorldMatrix(true, false)
        scene.matrixWorld.copy(parent.matrixWorld)
      } else {
        scene.matrixWorld.identity()
      }

      // This bit is only necessary if the portal is blended, now it has a render-priority
      // and will take over the render loop
      if (priority) {
        if (material.current && material.current.blend > 0 && material.current.blend < 1) {
          // If blend is ongoing (> 0 and < 1) then we need to render both the root scene
          // and the portal scene, both will then be mixed in the quad from above
          blendMat.blend = material.current.blend
          state.gl.setRenderTarget(buffer1)
          state.gl.render(scene, state.camera)
          state.gl.setRenderTarget(buffer2)
          state.gl.render(rootScene, state.camera)
          state.gl.setRenderTarget(null)
          quad.render(state.gl as unknown as THREE.WebGPURenderer)
        } else if (material.current?.blend === 1) {
          // However if blend is 1 we only need to render the portal scene
          state.gl.render(scene, state.camera)
        }
      }
    }
  }, priority)

  return <></>
}
