import * as React from 'react'

import { Setup } from '../Setup'
import { Sampler, Decal, useTexture, useSurfaceSampler, PerspectiveCamera, OrbitControls } from '../../src'
import { Euler, InstancedBufferAttribute, Matrix4, Mesh, Quaternion, Vector3 } from 'three'

function LoopOverInstancedBufferAttribute({ children, buffer }: { buffer?: InstancedBufferAttribute; children: any }) {
  const [m] = React.useState(() => new Matrix4())
  return (buffer &&
    [...new Array(buffer.count)].map((_, i) => {
      const p = new Vector3()
      const q = new Quaternion()
      const r = new Euler()
      const s = new Vector3()

      m.fromArray(buffer.array, i * 16)
      m.decompose(p, q, s)
      r.setFromQuaternion(q)

      return children({ key: i, position: p, rotation: r, scale: s })
    })) as any
}

export default {
  title: 'Misc/Decal',
  component: Sampler,
  decorators: [
    (storyFn) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <React.Suspense fallback={null}>{storyFn()}</React.Suspense>
      </Setup>
    ),
  ],
}

function DecalScene() {
  const ref = React.useRef<any>()

  const [reactMap, threeMap] = useTexture(['/decals/react.png', '/decals/three.png'])

  const transform = React.useCallback(({ dummy, position, normal }) => {
    const p = new Vector3()
    p.copy(position)

    const r = new Euler()
    r.x = Math.random() * Math.PI

    dummy.position.copy(position)
    dummy.rotation.copy(r)
    dummy.lookAt(p.add(normal))
  }, [])

  const bufferAttribute = useSurfaceSampler(ref, 50, transform)

  return (
    <>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.75} />
      <PerspectiveCamera makeDefault position={[6, 6, 6]} />

      <directionalLight position={[1, -1, 1]} />

      <mesh ref={ref}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshPhysicalMaterial color={'tomato'} roughness={0.5} />
      </mesh>

      <LoopOverInstancedBufferAttribute buffer={bufferAttribute}>
        {({ ...props }) => (
          <Decal mesh={ref} {...props}>
            <meshPhysicalMaterial
              roughness={0.2}
              transparent
              depthTest={false}
              map={Math.random() > 0.5 ? reactMap : threeMap}
              alphaTest={0}
              polygonOffset={true}
              polygonOffsetFactor={-10}
            />
          </Decal>
        )}
      </LoopOverInstancedBufferAttribute>
    </>
  )
}

export const DecalSt = () => <DecalScene />
DecalSt.storyName = 'Default'
