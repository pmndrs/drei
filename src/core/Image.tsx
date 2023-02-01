import * as React from 'react'
import * as THREE from 'three'
import { Color, extend, useThree } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'
import { useTexture } from './useTexture'

export type ImageProps = Omit<JSX.IntrinsicElements['mesh'], 'scale'> & {
  segments?: number
  scale?: number | [number, number]
  color?: Color
  zoom?: number
  grayscale?: number
  toneMapped?: boolean
  transparent?: boolean
  opacity?: number
} & ({ texture: THREE.Texture; url?: never } | { texture?: never; url: string }) // {texture: THREE.Texture} XOR {url: string}

type ImageMaterialType = JSX.IntrinsicElements['shaderMaterial'] & {
  scale?: number[]
  imageBounds?: number[]
  color?: Color
  map: THREE.Texture
  zoom?: number
  grayscale?: number
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      imageMaterial: ImageMaterialType
    }
  }
}

const ImageMaterialImpl = shaderMaterial(
  { color: new THREE.Color('white'), scale: [1, 1], imageBounds: [1, 1], map: null, zoom: 1, grayscale: 0, opacity: 1 },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    vUv = uv;
  }
`,
  /* glsl */ `
  // mostly from https://gist.github.com/statico/df64c5d167362ecf7b34fca0b1459a44
  varying vec2 vUv;
  uniform vec2 scale;
  uniform vec2 imageBounds;
  uniform vec3 color;
  uniform sampler2D map;
  uniform float zoom;
  uniform float grayscale;
  uniform float opacity;
  const vec3 luma = vec3(.299, 0.587, 0.114);
  vec4 toGrayscale(vec4 color, float intensity) {
    return vec4(mix(color.rgb, vec3(dot(color.rgb, luma)), intensity), color.a);
  }
  vec2 aspect(vec2 size) {
    return size / min(size.x, size.y);
  }
  void main() {
    vec2 s = aspect(scale);
    vec2 i = aspect(imageBounds);
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;
    vec2 zUv = (uv - vec2(0.5, 0.5)) / zoom + vec2(0.5, 0.5);
    gl_FragColor = toGrayscale(texture2D(map, zUv) * vec4(color, opacity), grayscale);
    
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
`
)

const ImageBase = React.forwardRef(
  (
    {
      children,
      color,
      segments = 1,
      scale = 1,
      zoom = 1,
      grayscale = 0,
      opacity = 1,
      texture,
      toneMapped,
      transparent,
      ...props
    }: Omit<ImageProps, 'url'>,
    ref: React.ForwardedRef<THREE.Mesh>
  ) => {
    extend({ ImageMaterial: ImageMaterialImpl })
    const gl = useThree((state) => state.gl)
    const planeBounds = Array.isArray(scale) ? [scale[0], scale[1]] : [scale, scale]
    const imageBounds = [texture!.image.width, texture!.image.height]
    return (
      <mesh ref={ref} scale={Array.isArray(scale) ? [...scale, 1] : scale} {...props}>
        <planeGeometry args={[1, 1, segments, segments]} />
        <imageMaterial
          color={color}
          map={texture!}
          map-encoding={gl.outputEncoding}
          zoom={zoom}
          grayscale={grayscale}
          opacity={opacity}
          scale={planeBounds}
          imageBounds={imageBounds}
          toneMapped={toneMapped}
          transparent={transparent}
        />
        {children}
      </mesh>
    )
  }
)

const ImageWithUrl = React.forwardRef(({ url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
  const texture = useTexture(url!)
  return <ImageBase {...props} texture={texture} ref={ref} />
})

const ImageWithTexture = React.forwardRef(
  ({ url: _url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
    return <ImageBase {...props} ref={ref} />
  }
)

export const Image = React.forwardRef<THREE.Mesh, ImageProps>((props, ref) => {
  if (props.url) return <ImageWithUrl {...props} ref={ref} />
  else if (props.texture) return <ImageWithTexture {...props} ref={ref} />
  else throw new Error('<Image /> requires a url or texture')
})
