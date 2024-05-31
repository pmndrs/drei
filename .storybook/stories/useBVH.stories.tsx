import * as React from 'react'

import { Setup } from '../Setup'
import { MeshBVHHelper } from 'three-mesh-bvh'

import { useHelper, useBVH, TorusKnot, OrbitControls } from '../../src'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, Raycaster, Vector3 } from 'three'

export default {
  title: 'Performance/useBVH',
  component: useBVH,
  decorators: [(storyFn) => <Setup controls={false}>{storyFn()}</Setup>],
}

const strategies = ['CENTER', 'AVERAGE', 'SAH'] as const

type Strategy = (typeof strategies)[number]

function TorusBVH({
  bvh,
  debug,
  strategy,
  ...props
}: { bvh: boolean; debug: boolean; strategy: Strategy } & React.ComponentProps<typeof TorusKnot>) {
  const mesh = React.useRef()
  const dummy = React.useRef()

  useBVH(bvh ? mesh : dummy, {
    splitStrategy: strategy,
  })

  useHelper(debug ? mesh : dummy, MeshBVHHelper)

  const [hovered, setHover] = React.useState(false)
  return (
    <TorusKnot
      {...props}
      ref={mesh}
      args={[1, 0.4, 250, 50]}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <meshBasicMaterial color={hovered ? 0xffff00 : 0xff0000} />
    </TorusKnot>
  )
}

const pointDist = 5
const raycaster = new Raycaster()
const origVec = new Vector3()
const dirVec = new Vector3()

const AddRaycaster = ({ grp }) => {
  // Objects
  const objRef = React.useRef<Mesh | null>(null)
  const origMesh = React.useRef<Mesh | null>(null)
  const hitMesh = React.useRef<Mesh | null>(null)
  const cylinderMesh = React.useRef<Mesh | null>(null)

  // set transforms
  React.useEffect(() => {
    if (!objRef.current || !origMesh.current || !hitMesh.current || !cylinderMesh.current) {
      return
    }
    hitMesh.current.scale.multiplyScalar(0.5)
    origMesh.current.position.set(pointDist, 0, 0)
    objRef.current.rotation.x = Math.random() * 10
    objRef.current.rotation.y = Math.random() * 10
  }, [])

  const xDir = Math.random() - 0.5
  const yDir = Math.random() - 0.5

  useFrame((_, delta) => {
    const obj: Mesh | null = objRef.current
    if (!obj || !origMesh.current || !hitMesh.current || !cylinderMesh.current) {
      return
    }
    obj.rotation.x += xDir * delta
    obj.rotation.y += yDir * delta

    origMesh.current.updateMatrixWorld()
    origVec.setFromMatrixPosition(origMesh.current.matrixWorld)
    dirVec.copy(origVec).multiplyScalar(-1).normalize()

    raycaster.set(origVec, dirVec)
    const ray: any = raycaster
    ray.firstHitOnly = true
    const res = raycaster.intersectObject(grp.current, true)
    const length = res.length ? res[0].distance : pointDist

    hitMesh.current.position.set(pointDist - length, 0, 0)
    cylinderMesh.current.position.set(pointDist - length / 2, 0, 0)
    cylinderMesh.current.scale.set(1, length, 1)
    cylinderMesh.current.rotation.z = Math.PI / 2
  })

  return (
    <group ref={objRef}>
      <mesh ref={origMesh}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh ref={hitMesh}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh ref={cylinderMesh}>
        <cylinderGeometry args={[0.01, 0.01]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

const DebugRayCast = ({ grp }) => {
  return (
    <>
      {new Array(40).fill({}).map((_, id) => {
        return <AddRaycaster key={id} grp={grp} />
      })}
    </>
  )
}

function Scene({ bvh, debug, strategy, ...args }) {
  const grp = React.useRef()

  const { raycaster }: any = useThree()
  raycaster.firstHitOnly = true

  return (
    <>
      <group ref={grp}>
        <TorusBVH bvh={bvh} position-z={-2} debug={debug} strategy={strategy} />
        <TorusBVH bvh={bvh} position-z={0} debug={debug} strategy={strategy} />
        <TorusBVH bvh={bvh} position-z={2} debug={debug} strategy={strategy} />
      </group>
      <DebugRayCast grp={grp} />
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const DefaultStory = (args) => <Scene {...args} />
DefaultStory.storyName = 'Default'
DefaultStory.args = {
  bvh: true,
  debug: true,
  strategy: strategies[0],
}
DefaultStory.argTypes = {
  strategy: { control: 'select', options: strategies },
}
