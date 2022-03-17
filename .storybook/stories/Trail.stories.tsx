import * as React from 'react'

import { Setup } from '../Setup'

import { Sphere, Trail } from '../../src'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

export default {
  title: 'Trail',
  component: Trail,
  decorators: [(storyFn) => <Setup> {storyFn()}</Setup>],
}

function TrailScene() {
  const sphere = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    if (sphere.current) {
      const t = clock.getElapsedTime()

      const speed = Math.sin(t * 2) * 0.5 + 1 * 0.1

      sphere.current.position.x = Math.cos(t * speed) * 2
      sphere.current.position.y = Math.sin(t * speed) * 2
    }
  })

  return (
    <>
      <Trail
        width={1}
        length={4}
        color={'#ffe656'}
        attenuation={(t: number) => {
          return t * t
        }}
      >
        <Sphere ref={sphere} args={[0.1, 32, 32]}>
          <meshNormalMaterial />
        </Sphere>
      </Trail>
    </>
  )
}

export const StarsSt = () => <TrailScene />
StarsSt.storyName = 'Default'
