import { HalfFloatType, Fog, FogExp2, Group, Texture, CubeCamera as CubeCameraImpl, WebGLCubeRenderTarget } from 'three'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'

type Props = JSX.IntrinsicElements['group'] & {
  /** Number of frames to render, Infinity */
  frames?: number
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Camera near, 0.1 */
  near?: number
  /** Camera far, 1000 */
  far?: number
  /** Custom environment map that is temporarily set as the scenes background */
  envMap?: THREE.Texture
  /** Custom fog that is temporarily set as the scenes fog */
  fog?: Fog | FogExp2
  /** The contents of CubeCamera will be hidden when filming the cube */
  children: (tex: Texture) => React.ReactNode
}

export function CubeCamera({
  children,
  fog,
  frames = Infinity,
  resolution = 256,
  near = 0.1,
  far = 1000,
  envMap,
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
  let originalFog
  let originalBackground
  useFrame(() => {
    if (camera && ref.current && (frames === Infinity || count < frames)) {
      ref.current.visible = false
      originalFog = scene.fog
      originalBackground = scene.background
      scene.background = envMap || originalBackground
      scene.fog = fog || originalFog
      camera.update(gl, scene)
      scene.fog = originalFog
      scene.background = originalBackground
      ref.current.visible = true
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
