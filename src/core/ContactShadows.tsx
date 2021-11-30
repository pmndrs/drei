// The author of the original code is @mrdoob https://twitter.com/mrdoob
// https://threejs.org/examples/?q=con#webgl_shadow_contact

import * as React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib'

type Props = Omit<JSX.IntrinsicElements['group'], 'scale'> & {
  opacity?: number
  width?: number
  height?: number
  blur?: number
  far?: number
  resolution?: number
  frames?: number
  scale?: number | [x: number, y: number]
}

export const ContactShadows = React.forwardRef(
  (
    {
      scale,
      frames = Infinity,
      opacity = 1,
      width = 1,
      height = 1,
      blur = 1,
      far = 10,
      resolution = 256,
      ...props
    }: Props,
    ref
  ) => {
    const scene = useThree(({ scene }) => scene)
    const gl = useThree(({ gl }) => gl)
    const shadowCamera = React.useRef<THREE.OrthographicCamera>()

    width = width * (Array.isArray(scale) ? scale[0] : scale || 1)
    height = height * (Array.isArray(scale) ? scale[1] : scale || 1)

    const [
      renderTarget,
      planeGeometry,
      depthMaterial,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial,
      renderTargetBlur,
    ] = React.useMemo(() => {
      const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution)
      const renderTargetBlur = new THREE.WebGLRenderTarget(resolution, resolution)
      renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false
      const planeGeometry = new THREE.PlaneBufferGeometry(width, height).rotateX(Math.PI / 2)
      const blurPlane = new THREE.Mesh(planeGeometry)
      const depthMaterial = new THREE.MeshDepthMaterial()
      depthMaterial.depthTest = depthMaterial.depthWrite = false
      depthMaterial.onBeforeCompile = (shader) =>
        (shader.fragmentShader = shader.fragmentShader.replace(
          '1.0 - fragCoordZ ), opacity );',
          '0.0 ), ( 1.0 - fragCoordZ ) * 1.0 );'
        ))
      const horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader)
      const verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader)
      verticalBlurMaterial.depthTest = horizontalBlurMaterial.depthTest = false
      return [
        renderTarget,
        planeGeometry,
        depthMaterial,
        blurPlane,
        horizontalBlurMaterial,
        verticalBlurMaterial,
        renderTargetBlur,
      ]
    }, [resolution, width, height, scale])

    let count = 0
    useFrame(() => {
      if (shadowCamera.current && (frames === Infinity || count < frames)) {
        const initialBackground = scene.background
        scene.background = null
        scene.overrideMaterial = depthMaterial
        gl.setRenderTarget(renderTarget)
        gl.render(scene, shadowCamera.current)
        scene.overrideMaterial = null
        blurPlane.material = horizontalBlurMaterial
        ;(blurPlane.material as any).uniforms.tDiffuse.value = renderTarget.texture
        horizontalBlurMaterial.uniforms.h.value = blur / 256
        gl.setRenderTarget(renderTargetBlur)
        gl.render(blurPlane, shadowCamera.current)
        blurPlane.material = verticalBlurMaterial
        ;(blurPlane.material as any).uniforms.tDiffuse.value = renderTargetBlur.texture
        verticalBlurMaterial.uniforms.v.value = blur / 256
        gl.setRenderTarget(renderTarget)
        gl.render(blurPlane, shadowCamera.current)
        gl.setRenderTarget(null)
        scene.background = initialBackground
        count++
      }
    })

    return (
      <group rotation-x={Math.PI / 2} {...props} ref={ref as any}>
        <mesh geometry={planeGeometry} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial map={renderTarget.texture} transparent opacity={opacity} />
        </mesh>
        <orthographicCamera ref={shadowCamera} args={[-width / 2, width / 2, height / 2, -height / 2, 0, far]} />
      </group>
    )
  }
)
