import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@storybook-setup'

import { Sphere, Trail, useTrail, Float, PerspectiveCamera } from 'drei'
import { useFrame } from '@react-three/fiber'
import { Group, InstancedMesh, Mesh, Object3D, Vector3 } from 'three'

export default {
  title: 'Misc/Trail',
  component: Trail,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Trail>

type Story = StoryObj<typeof Trail>

function TrailScene(props: React.ComponentProps<typeof Trail>) {
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
        <Trail {...props}>
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

export const TrailsSt = {
  args: {
    width: 1,
    length: 4,
    color: '#F8D628',
    attenuation: (t: number) => {
      return t * t
    },
  },
  render: (args) => <TrailScene {...args} />,
  name: 'Default',
} satisfies Story

//

type InstancesTrailProps = {
  sphere: Mesh
  instancesRef: React.RefObject<InstancedMesh>
}

// Trail component
function InstancesTrail({ sphere, instancesRef }: InstancesTrailProps) {
  const trailPositions = useTrail(sphere, { length: 5, decay: 5, interval: 6 })
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
  const [sphere, setSphere] = React.useState<Mesh | null>(null)
  const instancesRef = React.useRef<InstancedMesh>(null!)

  const sphereRefCallback = (node: Mesh) => {
    if (node !== null) {
      setSphere(node)
    }
  }

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (!sphere) return

    sphere.position.x = Math.sin(t) * 3 + Math.cos(t * 2)
    sphere.position.y = Math.cos(t) * 3
  })

  return (
    <>
      <Sphere ref={sphereRefCallback} args={[0.1, 32, 32]} position-x={0} position-y={3}>
        <meshNormalMaterial />
      </Sphere>
      {sphere && <InstancesTrail sphere={sphere} instancesRef={instancesRef} />}
    </>
  )
}

export const UseTrailSt = {
  render: () => <UseTrailScene />,
  name: 'useTrail with Instances',
} satisfies StoryObj<React.ComponentProps<typeof UseTrailScene>>

//

function UseTrailFloat(props: React.ComponentProps<typeof Trail>) {
  const ref = React.useRef<Group>(null!)
  return (
    <>
      <Trail {...props} target={ref} />
      <Float speed={5} floatIntensity={10} ref={ref}>
        <Sphere args={[0.1, 32, 32]} position-x={0}>
          <meshNormalMaterial />
        </Sphere>
      </Float>
    </>
  )
}

export const TrailFloat = {
  args: {
    width: 1,
    length: 4,
    color: '#F8D628',
    attenuation: (t: number) => {
      return t * t
    },
  },
  render: (args) => <UseTrailFloat {...args} />,
  name: 'Trail with Ref target',
} satisfies Story
