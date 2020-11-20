// The author of the original code is @mrdoob https://twitter.com/mrdoob
// https://threejs.org/examples/?q=con#webgl_shadow_contact

import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader'
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader'

type Props = JSX.IntrinsicElements['group'] & {
  opacity?: number
  width?: number
  height?: number
  blur?: number
  far?: number
  resolution?: number
}

const scale: [number, number, number] = [1, -1, 1]
const rotation: [number, number, number] = [-Math.PI / 2, 0, 0]

export const ContactShadows = React.forwardRef(
  ({ opacity = 1, width = 1, height = 1, blur = 1, far = 10, resolution = 256, ...props }: Props, ref) => {
    const { scene, gl } = useThree()
    const shadowCamera = React.useRef<THREE.OrthographicCamera>()
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
    }, [resolution, width, height])

    useFrame(() => {
      if (shadowCamera.current) {
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
      }
    })

    const orthographicCameraArgs: [number, number, number, number, number, number] = React.useMemo(
      function memo() {
        return [-width / 2, width / 2, height / 2, -height / 2, 0, far]
      },
      [far, width, height]
    )

    return (
      <group {...props} ref={ref as any}>
        <mesh geometry={planeGeometry} scale={scale} rotation={rotation}>
          <meshBasicMaterial map={renderTarget.texture} transparent opacity={opacity} />
        </mesh>
        <orthographicCamera ref={shadowCamera} args={orthographicCameraArgs} />
      </group>
    )
  }
)
