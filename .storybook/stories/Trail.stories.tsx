import * as React from 'react'

import { Setup } from '../Setup'

import { Sphere, Trail, useTrail, Html, Stats, Float, PerspectiveCamera } from '../../src'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Mesh, Object3D, Vector3 } from 'three'

export default {
  title: 'Misc/Trail',
  component: Trail,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}> {storyFn()}</Setup>],
}

function TrailScene() {
  const group = React.useRef<Mesh>(null!)
  const sphere = React.useRef<Mesh>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    group.current.rotation.z = t

    sphere.current.position.x = Math.sin(t * 2) * 2
    sphere.current.position.z = Math.cos(t * 2) * 2
  })

  return (
    <>
      <group ref={group}>
        <Trail
          width={1}
          length={4}
          color={'#F8D628'}
          attenuation={(t: number) => {
            return t * t
          }}
        >
          <Sphere ref={sphere} args={[0.1, 32, 32]} position-y={3}>
            <meshNormalMaterial />
          </Sphere>
        </Trail>
      </group>

      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <axesHelper />
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

  const trailPositions = useTrail(sphere, { length: 5, decay: 5, interval: 6 })
  const n = 1000

  const [o] = React.useState(() => new Object3D())
  function updateInstances() {
    if (!instancesRef.current) return

    for (let i = 0; i < n; i += 1) {
      const x = trailPositions.current?.slice(i * 3, i * 3 + 3)
      // @ts-ignore
      o.position.set(...x)

      o.scale.setScalar((i * 10) / n)
      o.updateMatrixWorld()

      instancesRef.current.setMatrixAt(i, o.matrixWorld)
    }

    instancesRef.current.count = n
    instancesRef.current.instanceMatrix.needsUpdate = true
  }

  useFrame(updateInstances)

  return (
    <>
      <Sphere ref={setSphere} args={[0.1, 32, 32]} position-x={0} position-y={3}>
        <meshNormalMaterial />
      </Sphere>

      <instancedMesh ref={instancesRef} args={[null!, null!, n]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshNormalMaterial />
      </instancedMesh>
    </>
  )
}

export const UseTrailSt = () => <UseTrailScene />
UseTrailSt.storyName = 'useTrail with Instances'

function UseTrailFloat() {
  const ref = React.useRef(null!)
  return (
    <>
      <Trail
        width={1}
        length={4}
        color={'#F8D628'}
        attenuation={(t: number) => {
          return t * t
        }}
        target={ref}
      />
      <Float speed={5} floatIntensity={10} ref={ref}>
        <Sphere args={[0.1, 32, 32]} position-x={0}>
          <meshNormalMaterial />
        </Sphere>
      </Float>
    </>
  )
}

export const TrailFloat = () => <UseTrailFloat />
TrailFloat.storyName = 'Trail with Ref target'
