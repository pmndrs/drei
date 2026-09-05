//* MeshPortalMaterial - TSL WebGPU Implementation ==============================
// Portal material with SDF-based edge blur and scene blending
// Uses Jump Flood Algorithm for SDF generation
// Authors:
//   N8, https://twitter.com/N8Programs
//   drcmda, https://twitter.com/0xca0a
// https://github.com/N8python/maskBlur
// TSL Conversion: Dennis Smolek

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial, QuadMesh, type Node } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec2,
  vec4,
  float,
  uv,
  screenCoordinate,
  materialReference,
  context,
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
import { withUniforms } from '@utils/withUniforms'

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
// Blends the portal texture with a signed distance field for smooth edges.

class PortalMaterialImpl extends withUniforms(MeshBasicNodeMaterial, {
  /** Edge fade blur, 0 = no blur */
  blur: () => uniform(0),
  /** Signed distance field of the parent geometry, generated on demand */
  sdf: () => uniformTexture(new THREE.Texture()),
  /** 0 = world scene, 0.5 = both, 1 = portal scene */
  blend: () => uniform(0),
  /** Largest SDF distance, used to normalise the field */
  size: () => uniform(0),
  /** Drawing-buffer size in pixels */
  resolution: () => uniform(new THREE.Vector2()),
}) {
  constructor() {
    super()
    // A texture reference requires a placeholder until RenderTexture attaches.
    this.map = new THREE.Texture()
    this._buildShader()
  }

  private _buildShader() {
    const { blur, sdf, size, resolution } = this.uniforms
    const map = materialReference('map', 'texture', this)

    this.colorNode = Fn(() => {
      // Sample the portal texture at screen coordinates
      const screenUv = screenCoordinate.xy.div(resolution)
      const t = context(map, { getUV: () => screenUv }) as unknown as Node<'vec4'>

      // Sample SDF at mesh UV for edge detection
      const d = sdf.sample(uv()).r.div(size)

      // alpha = 1 - smoothstep(0, 1, clamp(d/blur + 1, 0, 1))
      const edgeFactor = clamp(d.div(blur).add(1.0), 0.0, 1.0)
      const alpha = float(1.0).sub(smoothstep(float(0.0), float(1.0), edgeFactor))

      // A zero blur preserves texture alpha. Positive blur fades the edges.
      const finalAlpha = select(blur.equal(0.0), t.a, t.a.mul(alpha))

      return vec4(t.rgb, finalAlpha)
    })()
  }
}

//* Blend Material (TSL) ==============================
// Mixes two textures based on blend factor

class BlendMaterial extends withUniforms(MeshBasicNodeMaterial, {
  textureA: () => uniformTexture(new THREE.Texture()),
  textureB: () => uniformTexture(new THREE.Texture()),
  blend: () => uniform(0),
}) {
  constructor() {
    super()
    const { textureA, textureB, blend } = this.uniforms
    this.colorNode = Fn(() => {
      const uvCoord = uv()
      return mix(textureB.sample(uvCoord), textureA.sample(uvCoord), blend)
    })()
  }
}

//* SDF Generator Materials (TSL) ==============================
// These passes output numerical data. fragmentNode bypasses colorNode's clamp
// to non-negative colors, which would erase the signed distances in the composite.

// UV Render - packs UV coordinates based on mask
class UVRenderMaterial extends withUniforms(MeshBasicNodeMaterial, {
  tex: () => uniformTexture(new THREE.Texture()),
  /** 1 = pack the inside of the mask, 0 = the outside */
  inside: () => uniform(0),
}) {
  constructor(inside = false) {
    super({ toneMapped: false })
    this.inside = inside ? 1 : 0
    const { tex, inside: insideUniform } = this.uniforms

    this.fragmentNode = Fn(() => {
      const uvCoord = uv()
      const roundedMask = round(tex.sample(uvCoord).x)

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
}

// Jump Flood Algorithm pass
class JumpFloodMaterial extends withUniforms(MeshBasicNodeMaterial, {
  tex: () => uniformTexture(new THREE.Texture()),
  offset: () => uniform(0),
  texelSize: () => uniform(new THREE.Vector2(1, 1)),
}) {
  constructor(clientWidth: number, clientHeight: number) {
    super({ toneMapped: false })
    this.uniforms.texelSize.value.set(1 / clientWidth, 1 / clientHeight)
    const { tex, offset, texelSize } = this.uniforms

    this.fragmentNode = Fn(() => {
      const uvCoord = uv()
      const closestDist = float(9999999.9).toVar()
      const closestPos = vec2(0.0, 0.0).toVar()

      // 3x3 neighbor search
      Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: x }) => {
        Loop({ start: int(-1), end: int(2), type: 'int', condition: '<' }, ({ i: y }) => {
          const sampleOffset = vec2(float(x), float(y)).mul(texelSize).mul(offset)
          const sampleUv = uvCoord.add(sampleOffset)
          const pos = tex.sample(sampleUv).xy

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
}

// Distance Field render - converts JFA output to distance
class DistanceFieldMaterial extends withUniforms(MeshBasicNodeMaterial, {
  tex: () => uniformTexture(new THREE.Texture()),
  size: () => uniform(new THREE.Vector2(1, 1)),
}) {
  constructor(clientWidth: number, clientHeight: number) {
    super({ toneMapped: false })
    this.uniforms.size.value.set(clientWidth, clientHeight)
    const { tex, size } = this.uniforms

    this.fragmentNode = Fn(() => {
      const uvCoord = uv()
      const pos = tex.sample(uvCoord).xy
      const dist = distance(size.mul(pos), size.mul(uvCoord))
      return vec4(dist, 0.0, 0.0, 1.0)
    })()
  }
}

// Composite - combines inside/outside distance fields
class CompositeMaterial extends withUniforms(MeshBasicNodeMaterial, {
  inside: () => uniformTexture(new THREE.Texture()),
  outside: () => uniformTexture(new THREE.Texture()),
  mask: () => uniformTexture(new THREE.Texture()),
}) {
  constructor() {
    super({ toneMapped: false })
    const { inside, outside, mask } = this.uniforms

    this.fragmentNode = Fn(() => {
      const uvCoord = uv()
      const i = inside.sample(uvCoord).x
      const o = outside.sample(uvCoord).x
      const maskVal = mask.sample(uvCoord).x

      // If mask is 0 (outside), use outside distance
      // Otherwise use negative inside distance
      const result = select(maskVal.equal(0.0), o, i.negate())

      return vec4(result, 0.0, 0.0, 1.0)
    })()
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

  const generate = (image: THREE.Texture) => {
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

    return finalTarget
  }

  return {
    generate,
    dispose() {
      for (const resource of [
        finalTarget,
        outsideRenderTarget,
        insideRenderTarget,
        outsideRenderTarget2,
        insideRenderTarget2,
        outsideRenderTargetFinal,
        insideRenderTargetFinal,
        uvRenderMat,
        uvRenderInsideMat,
        jumpFloodMat,
        distanceFieldMat,
        compositeMat,
      ])
        resource.dispose()
    },
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
      const { scene, renderer, size, viewport, setEvents, invalidate } = useThree()
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
      const needsSdf = blur !== 0
      // See if the parent mesh is in the camera frustum
      const parent = useIntersect(setVisible) as React.RefObject<THREE.Mesh<THREE.BufferGeometry>>
      React.useLayoutEffect(() => {
        // Since the ref above is not tied to a mesh directly (we're inside a material),
        // it has to be tied to the parent mesh here
        parent.current = (ref.current as any)?.__r3f?.parent?.object
      }, [])

      React.useLayoutEffect(() => {
        if (!parent.current || !needsSdf) return
        const material = ref.current
        const previousSdf = material.sdf
        const previousSize = material.size
        const gpuRenderer = renderer as THREE.WebGPURenderer

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

        const sg = makeSDFGenerator(resolution, resolution, gpuRenderer)
        const previousTarget = gpuRenderer.getRenderTarget()
        const previousClearColor = gpuRenderer.getClearColor(new THREE.Color())
        const previousClearAlpha = gpuRenderer.getClearAlpha()
        let sdf: ReturnType<typeof sg.generate>
        try {
          gpuRenderer.setClearColor(0x000000, 0)
          gpuRenderer.setRenderTarget(maskRenderTarget)
          gpuRenderer.render(tempMesh, orthoCam)
          sdf = sg.generate(maskRenderTarget.texture)
        } catch (error) {
          sg.dispose()
          throw error
        } finally {
          gpuRenderer.setRenderTarget(previousTarget)
          gpuRenderer.setClearColor(previousClearColor, previousClearAlpha)
          tempMesh.material.dispose()
        }

        let cancelled = false
        gpuRenderer
          .readRenderTargetPixelsAsync(sdf, 0, 0, resolution, resolution)
          .then((readSdf) => {
            if (cancelled) return
            // Normalize the field by its greatest interior distance.
            let min = Infinity
            for (let i = 0; i < readSdf.length; i++) {
              if (readSdf[i] < min) min = readSdf[i]
            }
            material.size = -min
            material.sdf = sdf.texture
            invalidate()
          })
          .catch((error) => {
            if (!cancelled) console.error('MeshPortalMaterial: SDF readback failed.', error)
          })
        return () => {
          cancelled = true
          material.sdf = previousSdf
          material.size = previousSize
          sg.dispose()
        }
      }, [resolution, needsSdf, renderer, maskRenderTarget, invalidate])

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
          ref={ref as any}
          blur={blur}
          blend={0}
          resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
          attach={'material' as any}
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

      // A blended portal owns rendering through its render priority.
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
