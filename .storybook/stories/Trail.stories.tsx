import * as React from 'react'

import { Setup } from '../Setup'

import { Sphere, Trail, useTrail, Html, Stats, Float, PerspectiveCamera } from '../../src'
import { useFrame } from '@react-three/fiber'
import { Group, InstancedMesh, Mesh, Object3D, Vector3 } from 'three'

export default {
  title: 'Misc/Trail',
  component: Trail,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}> {storyFn()}</Setup>],
}

function TrailScene() {
  const group = React.useRef<Group>(null!)
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

type TheTrailProps = {
  sphereRef: React.RefObject<Mesh>
  instancesRef: React.RefObject<InstancedMesh>
}

// Trail component
function TheTrail({ sphereRef, instancesRef }: TheTrailProps) {
  const trailPositions = useTrail(sphereRef.current!, { length: 5, decay: 5, interval: 6 })
  const n = 1000
  const oRef = React.useRef(new Object3D())

  useFrame(() => {
    if (!instancesRef.current || !trailPositions.current) return
    const o = oRef.current
    for (let i = 0; i < n; i += 1) {
      const [x, y, z] = trailPositions.current.slice(i * 3, i * 3 + 3)

      o.position.set(x, y, z)
      o.scale.setScalar((i * 10) / n)
      o.updateMatrixWorld()

      instancesRef.current.setMatrixAt(i, o.matrixWorld)
    }

    instancesRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={instancesRef} args={[null!, null!, n]}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshNormalMaterial />
    </instancedMesh>
  )
}

function UseTrailScene() {
  const sphereRef = React.useRef<Mesh>(null!)
  const instancesRef = React.useRef<InstancedMesh>(null!)

  const [isSphereReady, setIsSphereReady] = React.useState(false)
  React.useEffect(() => {
    if (sphereRef.current) setIsSphereReady(true)
  }, [sphereRef.current])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    sphereRef.current.position.x = Math.sin(t) * 3 + Math.cos(t * 2)
    sphereRef.current.position.y = Math.cos(t) * 3
  })

  return (
    <>
      <Sphere ref={sphereRef} args={[0.1, 32, 32]} position-x={0} position-y={3}>
        <meshNormalMaterial />
      </Sphere>
      {isSphereReady && <TheTrail sphereRef={sphereRef} instancesRef={instancesRef} />}
    </>
  )
}

export const UseTrailSt = () => <UseTrailScene />
UseTrailSt.storyName = 'useTrail with Instances'

function UseTrailFloat() {
  const ref = React.useRef<Group>(null!)
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
