import {
  HalfFloatType,
  Fog,
  FogExp2,
  Group,
  Texture,
  CubeCamera as CubeCameraImpl,
  WebGLCubeRenderTarget,
  LinearFilter,
} from 'three'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'

type Props = JSX.IntrinsicElements['group'] & {
  fog?: Fog | FogExp2
  frames?: number
  resolution?: number
  near?: number
  far?: number
  children: (tex: Texture) => React.ReactNode
}

export function CubeCamera({
  children,
  fog,
  frames = Infinity,
  resolution = 256,
  near = 0.1,
  far = 1000,
  ...props
}: Props) {
  const ref = React.useRef<Group>()
  const [camera, setCamera] = React.useState<CubeCameraImpl | null>(null)
  const scene = useThree(({ scene }) => scene)
  const gl = useThree(({ gl }) => gl)
  const fbo = React.useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(resolution)
    fbo.texture.encoding = gl.outputEncoding
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])
  let count = 0
  useFrame(() => {
    if (camera && ref.current && (frames === Infinity || count < frames)) {
      ref.current.traverse((obj) => (obj.visible = false))
      const originalFog = scene.fog
      scene.fog = fog || originalFog
      camera.update(gl, scene)
      scene.fog = originalFog
      ref.current.traverse((obj) => (obj.visible = true))
      count++
    }
  })
  return (
    <group {...props}>
      <cubeCamera ref={setCamera} args={[near, far, fbo]} />
      <group ref={ref}>{children(fbo.texture)}</group>
    </group>
  )
}
