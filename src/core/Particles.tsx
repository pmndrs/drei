import * as React from 'react'
import * as THREE from 'three'
import { PointsProps, useFrame, extend, Node } from '@react-three/fiber'
import { shaderMaterial } from '.'

// eslint-disable-next-line
// @ts-ignore
import fragShader from '../helpers/glsl/Particles.frag.glsl'
// eslint-disable-next-line
// @ts-ignore
import vertShader from '../helpers/glsl/Particles.vert.glsl'

interface Props {
  count?: number
  speed?: number
  opacity?: number
  color?: THREE.ColorRepresentation
  pixelRatio?: number
  size?: number | Float32Array
}

const ParticleMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color('white').convertLinearToSRGB(),
    speed: 1,
    opacity: 1,
    pixelRatio: 2,
  },
  vertShader,
  fragShader
)
extend({ ParticleMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      particleMaterial: Node<any, any>
    }
  }
}

export const Particles = React.forwardRef<THREE.Points, Props & PointsProps>(
  ({ count = 100, speed = 1, opacity = 1, pixelRatio, scale = [1, 1, 1], size = 1, color, ...props }, forwardRef) => {
    const matRef = React.useRef<any>()
    const positions = Float32Array.from(
      Array.from({ length: count }, () => [
        THREE.MathUtils.randFloatSpread(scale[0]),
        THREE.MathUtils.randFloatSpread(scale[1]),
        THREE.MathUtils.randFloatSpread(scale[2]),
      ]).flat()
    )
    const sizes = React.useMemo(() => {
      if (size) {
        if (size.constructor === Float32Array) {
          return size as Float32Array
        } else {
          return new Float32Array(Array.from({ length: count }, () => size as number))
        }
      }
      return new Float32Array(Array.from({ length: count }, () => 1))
    }, [size, count])

    useFrame(({ clock }) => (matRef.current.uniforms.time.value = clock.elapsedTime))

    React.useEffect(
      () => void (matRef.current.uniforms.pixelRatio.value = pixelRatio ?? window.devicePixelRatio),
      [pixelRatio]
    )

    return (
      <points {...props} ref={forwardRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <particleMaterial
          ref={matRef}
          transparent
          opacity={opacity}
          pixelRatio={pixelRatio}
          speed={speed}
          color={color}
          depthWrite={false}
        />
      </points>
    )
  }
)
