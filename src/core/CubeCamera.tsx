import { Group, CubeCamera as CubeCameraImpl, WebGLCubeRenderTarget, LinearFilter, RGBFormat } from 'three'
import * as React from 'react'
import { useFrame, useThree } from 'react-three-fiber'

export function CubeCamera({ children, frames = Infinity, resolution = 256, near = 1, far = 1000, ...props }) {
  const ref = React.useRef<Group>()
  const [camera, setCamera] = React.useState<CubeCameraImpl>()
  const { scene, gl } = useThree()
  const fbo = React.useMemo(
    () =>
      new WebGLCubeRenderTarget(resolution, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBFormat,
        encoding: gl.outputEncoding,
      }),
    [near, far, resolution]
  )
  let count = 0
  useFrame(() => {
    if (camera && ref.current && (frames === Infinity || count < frames)) {
      ref.current.traverse((obj) => (obj.visible = false))
      camera.update(gl, scene)
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
