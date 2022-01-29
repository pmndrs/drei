import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Mesh, RepeatWrapping, Vector2 } from 'three'

import { Setup } from '../Setup'
import { MeshReflectorMaterial, useTexture, TorusKnot, Box, Environment } from '../../src'

export default {
  title: 'Shaders/MeshReflectorMaterial',
  component: MeshReflectorMaterial,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={20} cameraPosition={new Vector3(-2, 2, 6)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function ReflectorScene({
  blur,
  depthScale,
  distortion,
  normalScale,
  reflectorOffset,
}: {
  blur?: [number, number]
  depthScale?: number
  distortion?: number
  normalScale?: number
  reflectorOffset?: number
}) {
  const roughness = useTexture('roughness_floor.jpeg')
  const normal = useTexture('NORM.jpg')
  const distortionMap = useTexture('dist_map.jpeg')
  const $box = React.useRef<Mesh>(null!)
  const _normalScale = React.useMemo(() => new Vector2(normalScale || 0), [normalScale])

  React.useEffect(() => {
    distortionMap.wrapS = distortionMap.wrapT = RepeatWrapping
    distortionMap.repeat.set(4, 4)
  }, [distortionMap])

  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 25
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[10, 10]} />
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.75}
          mixBlur={10}
          mixStrength={2}
          blur={blur || [0, 0]}
          minDepthThreshold={0.8}
          maxDepthThreshold={1.2}
          depthScale={depthScale || 0}
          depthToBlurRatioBias={0.2}
          debug={0}
          distortion={distortion || 0}
          distortionMap={distortionMap}
          color="#a0a0a0"
          metalness={0.5}
          roughnessMap={roughness}
          roughness={1}
          normalMap={normal}
          normalScale={_normalScale}
          reflectorOffset={reflectorOffset}
        />
      </mesh>

      <Box args={[2, 3, 0.2]} position={[0, 1.6, -3]}>
        <meshPhysicalMaterial color="hotpink" />
      </Box>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <spotLight intensity={1} position={[10, 6, 10]} penumbra={1} angle={0.3} />
      <Environment preset="city" />
    </>
  )
}

export const ReflectorSt = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene blur={[100, 500]} depthScale={2} distortion={0.3} normalScale={0.5} />
  </React.Suspense>
)
ReflectorSt.storyName = 'Default'

export const ReflectorPlain = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene />
  </React.Suspense>
)
ReflectorPlain.storyName = 'Plain'

export const ReflectorBlur = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene blur={[500, 500]} />
  </React.Suspense>
)
ReflectorBlur.storyName = 'Blur'

export const ReflectorDepth = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene depthScale={2} />
  </React.Suspense>
)
ReflectorDepth.storyName = 'Depth'

export const ReflectorDistortion = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene distortion={1} />
  </React.Suspense>
)
ReflectorDistortion.storyName = 'Distortion'

export const ReflectorNormalMap = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene normalScale={0.5} />
  </React.Suspense>
)
ReflectorNormalMap.storyName = 'NormalMap'

export const ReflectorOffset = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene reflectorOffset={1} />
  </React.Suspense>
)
ReflectorOffset.storyName = 'ReflectorOffset'
