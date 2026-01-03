//* Image Component - WebGPU TSL Version ==============================
// Displays an image texture with aspect-ratio preservation, zoom, rounded corners, and grayscale effects

import * as React from 'react'
import * as THREE from 'three/webgpu'
import {
  Fn,
  uniform,
  vec2,
  vec3,
  vec4,
  float,
  texture as tslTexture,
  uv,
  mix,
  length,
  max,
  abs,
  min,
  smoothstep,
  dot,
  select,
} from 'three/tsl'
import { Color, ThreeElements, useThree } from '@react-three/fiber'
import { useTexture } from '@core/Loaders/useTexture'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type ImageProps = Omit<ThreeElements['mesh'], 'scale'> & {
  segments?: number
  scale?: number | [number, number]
  color?: Color
  zoom?: number
  radius?: number
  grayscale?: number
  toneMapped?: boolean
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
} & ({ texture: THREE.Texture; url?: never } | { texture?: never; url: string })

//* TSL Shader Helpers ==============================

// Luminance weights for grayscale conversion (ITU-R BT.601)
const LUMA = /* @__PURE__ */ vec3(0.299, 0.587, 0.114)

// Converts color to grayscale with adjustable intensity blend
const toGrayscale = /* @__PURE__ */ Fn(
  ([inputColor, intensity]: [ReturnType<typeof vec4>, ReturnType<typeof float>]) => {
    const gray = vec3(dot(inputColor.rgb, LUMA))
    return vec4(mix(inputColor.rgb, gray, intensity), inputColor.a)
  }
)

// Normalizes size by minimum dimension for aspect ratio calculations
const aspect = (size: any) => size.div(min(size.x, size.y))

// Signed distance function for rounded rectangle (from iquilezles.org/articles/distfunctions)
const udRoundBox = /* @__PURE__ */ Fn(
  ([p, b, r]: [ReturnType<typeof vec2>, ReturnType<typeof vec2>, ReturnType<typeof float>]) => {
    return length(max(abs(p).sub(b).add(r), float(0))).sub(r)
  }
)

//* Image Material Hook ==============================

interface ImageMaterialOptions {
  color: Color
  zoom: number
  radius: number
  grayscale: number
  opacity: number
  scale: number[]
  imageBounds: number[]
  resolution: number
  toneMapped?: boolean
  transparent?: boolean
  side?: THREE.Side
}

function useImageMaterial(tex: THREE.Texture, options: ImageMaterialOptions) {
  // Create stable uniform refs - these persist across renders
  const uniforms = React.useMemo(
    () => ({
      color: uniform(new THREE.Color('white')),
      scale: uniform(new THREE.Vector2(1, 1)),
      imageBounds: uniform(new THREE.Vector2(1, 1)),
      resolution: uniform(1024),
      zoom: uniform(1),
      radius: uniform(0),
      grayscale: uniform(0),
      opacity: uniform(1),
    }),
    []
  )

  // Create material with TSL shader - recreate when texture changes
  const material = React.useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial()

    // Build the fragment shader using TSL
    mat.colorNode = Fn(() => {
      const uvCoord = uv()

      //* Aspect Ratio Calculations --
      // Normalize both plane and image dimensions by their minimum axis
      const s = aspect(uniforms.scale)
      const i = aspect(uniforms.imageBounds)
      const rs = s.x.div(s.y) // plane aspect ratio
      const ri = i.x.div(i.y) // image aspect ratio

      //* Cover Behavior --
      // Scale UV to fill plane while maintaining image aspect ratio
      const newX = select(rs.lessThan(ri), i.x.mul(s.y).div(i.y), s.x)
      const newY = select(rs.lessThan(ri), s.y, i.y.mul(s.x).div(i.x))
      const newSize = vec2(newX, newY)

      // Calculate offset to center the image
      const offsetX = select(rs.lessThan(ri), newX.sub(s.x).div(float(2)).div(newX), float(0))
      const offsetY = select(rs.lessThan(ri), float(0), newY.sub(s.y).div(float(2)).div(newY))
      const offset = vec2(offsetX, offsetY)

      // Transform UVs for aspect-correct sampling
      const transformedUv = uvCoord.mul(s).div(newSize).add(offset)

      //* Zoom Effect --
      // Scale UVs from center point
      const zUv = transformedUv.sub(vec2(0.5, 0.5)).div(uniforms.zoom).add(vec2(0.5, 0.5))

      //* Rounded Corners (SDF) --
      // Calculate signed distance to rounded rectangle edge
      const res = uniforms.scale.mul(uniforms.resolution)
      const halfRes = res.mul(0.5)
      const dist = udRoundBox(uvCoord.mul(res).sub(halfRes), halfRes, uniforms.resolution.mul(uniforms.radius))
      // Alpha is 1 inside, smoothly fades to 0 outside
      const edgeAlpha = smoothstep(float(1.0), float(0.0), dist)

      //* Final Color Composition --
      const texColor = tslTexture(tex, zUv)
      const tintedRgb = texColor.rgb.mul(uniforms.color)
      const finalAlpha = texColor.a.mul(uniforms.opacity).mul(edgeAlpha)
      const tinted = vec4(tintedRgb, finalAlpha)

      return toGrayscale(tinted, uniforms.grayscale)
    })()

    return mat
  }, [tex, uniforms])

  // Update uniform values when props change
  React.useLayoutEffect(() => {
    uniforms.color.value.set(options.color as THREE.ColorRepresentation)
    uniforms.scale.value.set(options.scale[0], options.scale[1])
    uniforms.imageBounds.value.set(options.imageBounds[0], options.imageBounds[1])
    uniforms.resolution.value = options.resolution
    uniforms.zoom.value = options.zoom
    uniforms.radius.value = options.radius
    uniforms.grayscale.value = options.grayscale
    uniforms.opacity.value = options.opacity
  }, [
    uniforms,
    options.color,
    options.scale[0],
    options.scale[1],
    options.imageBounds[0],
    options.imageBounds[1],
    options.resolution,
    options.zoom,
    options.radius,
    options.grayscale,
    options.opacity,
  ])

  // Update material properties
  React.useLayoutEffect(() => {
    material.toneMapped = options.toneMapped ?? true
    material.transparent = options.transparent ?? false
    if (options.side !== undefined) material.side = options.side
    material.needsUpdate = true
  }, [material, options.toneMapped, options.transparent, options.side])

  return material
}

//* ImageBase Component ==============================

const ImageBase: ForwardRefComponent<Omit<ImageProps, 'url'>, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  (
    {
      children,
      color = 'white',
      segments = 1,
      scale = 1,
      zoom = 1,
      grayscale = 0,
      opacity = 1,
      radius = 0,
      texture,
      toneMapped,
      transparent,
      side,
      ...props
    },
    fref
  ) => {
    const ref = React.useRef<THREE.Mesh>(null!)
    const size = useThree((state) => state.size)

    const planeBounds = Array.isArray(scale) ? [scale[0], scale[1]] : [scale, scale]
    const img = texture!.image as { width: number; height: number }
    const imageBounds = [img.width, img.height]
    const resolution = Math.max(size.width, size.height)

    const material = useImageMaterial(texture!, {
      color,
      zoom,
      radius,
      grayscale,
      opacity,
      scale: planeBounds,
      imageBounds,
      resolution,
      toneMapped,
      transparent,
      side,
    })

    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <mesh ref={ref} scale={Array.isArray(scale) ? [...scale, 1] : scale} {...props}>
        <planeGeometry args={[1, 1, segments, segments]} />
        <primitive object={material} attach="material" />
        {children}
      </mesh>
    )
  }
)

//* ImageWithUrl Component ==============================

const ImageWithUrl: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
    const texture = useTexture(url!)
    return <ImageBase {...props} texture={texture} ref={ref} />
  }
)

//* ImageWithTexture Component ==============================

const ImageWithTexture: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ url: _url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
    return <ImageBase {...props} ref={ref} />
  }
)

//* Main Image Export ==============================

export const Image: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  ImageProps
>((props, ref) => {
  if (props.url) return <ImageWithUrl {...props} ref={ref} />
  else if (props.texture) return <ImageWithTexture {...props} ref={ref} />
  else throw new Error('<Image /> requires a url or texture')
})
