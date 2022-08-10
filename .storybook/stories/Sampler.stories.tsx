import * as React from 'react'

import { Setup } from '../Setup'

import { Sphere, Sampler, Float, ComputedAttribute, TransformFn } from '../../src'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, Mesh, Vector3 } from 'three'

export default {
  title: 'Misc/Sampler',
  component: Sampler,
  decorators: [(storyFn) => <Setup cameraPosition={new Vector3(0, 0, 5)}> {storyFn()}</Setup>],
}

function SamplerScene() {
  return (
    <>
      <Sampler count={500}>
        <mesh>
          <torusKnotGeometry />
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

export const SamplerSt = () => <SamplerScene />
SamplerSt.storyName = 'Default'

function RefAPIScene() {
  const meshRef = React.useRef(null)
  const instancesRef = React.useRef(null)

  return (
    <>
      <Sampler count={500} mesh={meshRef} instances={instancesRef} />

      <mesh ref={meshRef}>
        <torusKnotGeometry />
        <meshNormalMaterial />
      </mesh>

      <instancedMesh ref={instancesRef} args={[null!, null!, 1_000]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshNormalMaterial />
      </instancedMesh>
    </>
  )
}

export const RefAPISt = () => <RefAPIScene />
RefAPISt.storyName = 'Using Refs'

function TransformSamplerScene() {
  return (
    <>
      <Sampler count={500} transform={transformInstances}>
        <mesh>
          <torusKnotGeometry />
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

export const SamplerTransformSt = () => <TransformSamplerScene />
SamplerTransformSt.storyName = 'With transform'

function SamplerWeightScene() {
  return (
    <>
      <Sampler count={500} weight="upness" transform={transformInstances}>
        <mesh>
          <torusKnotGeometry>
            <ComputedAttribute name="upness" compute={computeUpness} />
          </torusKnotGeometry>
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32, Math.PI / 2]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

export const SamplerWeightSt = () => <SamplerWeightScene />
SamplerWeightSt.storyName = 'With weight'

function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
  return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1)
}

const transformInstances: TransformFn = ({ dummy, position }) => {
  dummy.position.copy(position)
  dummy.scale.setScalar(Math.random() * 0.75)
}

const computeUpness = (geometry) => {
  const { array, count } = geometry.attributes.normal
  const arr = Float32Array.from({ length: count })

  const normalVector = new Vector3()
  const up = new Vector3(0, 1, 0)

  for (let i = 0; i < count; i++) {
    const n = array.slice(i * 3, i * 3 + 3)
    normalVector.set(n[0], n[1], n[2])

    const dot = normalVector.dot(up)
    const value = dot > 0.4 ? remap(dot, [0.4, 1], [0, 1]) : 0
    arr[i] = Number(value)
  }

  return new BufferAttribute(arr, 1)
}
