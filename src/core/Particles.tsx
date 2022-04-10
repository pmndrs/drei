import * as React from 'react'
import * as THREE from 'three'
import { PointsProps, useFrame } from '@react-three/fiber'

// eslint-disable-next-line
// @ts-ignore
import curlNoiseShader from '../helpers/glsl/CurlNoise.glsl'
// eslint-disable-next-line
// @ts-ignore
import fragShader from '../helpers/glsl/Particles.frag.glsl'
// eslint-disable-next-line
// @ts-ignore
import vertShader from '../helpers/glsl/Particles.vert.glsl'

interface Props {
  amount?: number
  size?: number
  opacity?: number
  radius?: number
  color?: THREE.ColorRepresentation
}

export const Particles = React.forwardRef<THREE.Points, Props & PointsProps>(
  ({ amount = 100, size = 1, opacity = 1, radius, color, ...props }, forwardRef) => {
    const matRef = React.useRef<any>()
    const positions = React.useMemo(
      () => new Float32Array(Array.from({ length: amount * 3 }, () => Math.random())),
      [length]
    )

    useFrame(({ clock }) => (matRef.current.uniforms.time.value = clock.elapsedTime))

    const uniforms = React.useMemo(
      () => ({
        time: {
          value: 0,
        },
        color: {
          value: new THREE.Color('white').convertLinearToSRGB(),
        },
        radius: {
          value: 1,
        },
        size: {
          value: 1,
        },
        opacity: {
          value: 1,
        },
      }),
      []
    )

    React.useEffect(() => void (opacity && (matRef.current.uniforms.opacity.value = opacity)), [opacity])
    React.useEffect(() => void (radius && (matRef.current.uniforms.radius.value = radius)), [radius])
    React.useEffect(() => void (size && (matRef.current.uniforms.size.value = size)), [size])
    React.useEffect(
      () => void (color && (matRef.current.uniforms.color.value = new THREE.Color(color).convertLinearToSRGB())),
      [color]
    )

    const vertex = React.useMemo(
      () => `
    ${curlNoiseShader}
    ${vertShader}
  `,
      []
    )

    return (
      <points {...props} ref={forwardRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          transparent
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragShader}
          blending={THREE.AdditiveBlending}
        />
      </points>
    )
  }
)
