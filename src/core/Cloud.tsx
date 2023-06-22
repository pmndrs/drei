import * as React from 'react'
import { Group, Texture } from 'three'
import { useFrame } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import { Billboard } from './Billboard'
import { Plane } from './shapes'
import { useTexture } from './useTexture'

export type CloudProps = {
  opacity?: number
  speed?: number
  width?: number
  depth?: number
  segments?: number
  texture?: string
  color?: string
  depthTest?: boolean
} & JSX.IntrinsicElements['group']

export function Cloud({
  opacity = 0.5,
  speed = 0.2,
  width = 10,
  depth = 1.5,
  segments = 20,
  texture,
  color = '#ffffff',
  depthTest = true,
  ...props
}: CloudProps) {
  const group = React.useRef<Group>()
  const cloudUri = suspend(async () => {
    return texture ? { default: texture } : import('../assets/textures/cloud.webp.js')
  }, ['r3f_drei_cloud', texture]).default

  const cloudTexture = useTexture(cloudUri) as Texture
  const clouds = React.useMemo(
    () =>
      [...new Array(segments)].map((_, index) => ({
        x: width / 2 - Math.random() * width,
        y: width / 2 - Math.random() * width,
        scale: 0.4 + Math.sin(((index + 1) / segments) * Math.PI) * ((0.2 + Math.random()) * 10),
        density: Math.max(0.2, Math.random()),
        rotation: Math.max(0.1, 0.2 * Math.random()) * speed,
      })),
    [width, segments, speed]
  )
  useFrame((state, delta) =>
    group.current?.children.forEach((cloud, index) => {
      cloud.children[0].rotation.z += clouds[index].rotation * delta
      cloud.children[0].scale.setScalar(
        clouds[index].scale + (((1 + Math.sin(state.clock.getElapsedTime() / 10)) / 2) * index) / 10
      )
    })
  )
  return (
    <group {...props}>
      <group position={[0, 0, (segments / 2) * depth]} ref={group}>
        {clouds.map(({ x, y, scale, density }, index) => (
          <Billboard key={index} position={[x, y, -index * depth]}>
            <Plane scale={scale} rotation={[0, 0, 0]}>
              <meshStandardMaterial
                map={cloudTexture}
                transparent
                opacity={(scale / 6) * density * opacity}
                depthTest={depthTest}
                color={color}
              />
            </Plane>
          </Billboard>
        ))}
      </group>
    </group>
  )
}
