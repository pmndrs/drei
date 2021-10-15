import * as React from 'react'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'
import { useTexture } from './useTexture'

export type ImageProps = JSX.IntrinsicElements['mesh'] & {
  segments?: number
  scale?: number
  zoom?: number
  grayscale?: number
  url: string
}

type ImageMaterialType = JSX.IntrinsicElements['shaderMaterial'] & {
  planeBounds?: number[]
  imageBounds?: number[]
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
  { planeBounds: [1, 1], imageBounds: [1, 1], map: null, zoom: 1, grayscale: 0 },
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
  uniform vec2 planeBounds;
  uniform vec2 imageBounds;
  uniform sampler2D map;
  uniform float zoom;
  uniform float grayscale;

  const vec3 luma = vec3(.299, 0.587, 0.114);
  vec4 toGrayscale(vec4 color, float intensity) {
    return vec4(mix(color.rgb, vec3(dot(color.rgb, luma)), intensity), color.a);
  }

  void main() {
    vec2 s = planeBounds;
    vec2 i = imageBounds;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;
    vec2 zUv = (uv - vec2(0.5, 0.5)) / zoom + vec2(0.5, 0.5);
    gl_FragColor = toGrayscale(texture2D(map, zUv), grayscale);
  }
`
)

function aspect(w, h) {
  const size = [w, h]
  const min = Math.min(...size)
  return [size[0] / min, size[1] / min]
}

export const Image = React.forwardRef(
  (
    { segments = 1, scale = 1, zoom = 1, grayscale = 0, url, ...props }: ImageProps,
    ref: React.ForwardedRef<THREE.Mesh>
  ) => {
    extend({ ImageMaterial: ImageMaterialImpl })
    const texture = useTexture(url)
    const planeBounds = React.useMemo(
      () => aspect(...((Array.isArray(scale) ? [scale[0], scale[1]] : [scale, scale]) as [number, number])),
      [scale]
    )
    const imageBounds = React.useMemo(() => aspect(texture.image.width, texture.image.height), [texture])
    return (
      <mesh ref={ref} scale={scale} {...props}>
        <planeGeometry args={[1, 1, segments, segments]} />
        <imageMaterial
          map={texture}
          zoom={zoom}
          grayscale={grayscale}
          planeBounds={planeBounds}
          imageBounds={imageBounds}
        />
      </mesh>
    )
  }
)
