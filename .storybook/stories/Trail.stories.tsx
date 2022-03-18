import * as React from 'react'

import { Setup } from '../Setup'

import { Sphere, Trail, useTrail } from '../../src'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Mesh, Object3D, Vector3 } from 'three'

export default {
  title: 'Misc/Trail',
  component: Trail,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}> {storyFn()}</Setup>],
}

function TrailScene() {
  const sphere = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    sphere.current.position.x = Math.sin(t) * 3
    sphere.current.position.y = Math.cos(t) * 3
  })

  return (
    <>
      <Trail
        width={1}
        length={4}
        color={'#F8D628'}
        attenuation={(t: number) => {
          return t * t
        }}
      >
        <Sphere ref={sphere} args={[0.1, 32, 32]} position-x={0} position-y={3}>
          <meshNormalMaterial />
        </Sphere>
      </Trail>
    </>
  )
}

export const TrailsSt = () => <TrailScene />
TrailsSt.storyName = 'Default'

function UseTrailScene() {
  const [sphere, setSphere] = React.useState<Mesh>(null!)
  const instancesRef = React.useRef<InstancedMesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    sphere.position.x = Math.sin(t) * 3 + Math.cos(t * 2)
    sphere.position.y = Math.cos(t) * 3
  })

  const trailPositions = useTrail(sphere, { length: 3 })
  const n = 3000

  const [o] = React.useState(() => new Object3D())
  function updateInstances() {
    if (!instancesRef.current) return

    for (let i = 0; i < n; i += 300) {
      const x = trailPositions.current.slice(i * 3, i * 3 + 3)
      // @ts-ignore
      o.position.set(...x)

      o.scale.setScalar((i / n) * 0.5)
      o.updateMatrixWorld()

      instancesRef.current.setMatrixAt(i, o.matrixWorld)
    }

    instancesRef.current.count = trailPositions.current.length / 3
    instancesRef.current.instanceMatrix.needsUpdate = true
  }

  useFrame(updateInstances)

  return (
    <>
      <Sphere ref={setSphere} args={[0.1, 32, 32]} position-x={0} position-y={3}>
        <meshNormalMaterial />
      </Sphere>

      <instancedMesh ref={instancesRef} args={[null, null, n]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshNormalMaterial />
      </instancedMesh>
    </>
  )
}

export const UseTrailSt = () => <UseTrailScene />
UseTrailSt.storyName = 'useTrail with Instances'