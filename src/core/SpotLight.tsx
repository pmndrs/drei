// Inspired by http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html

import * as React from 'react'
import { Mesh, DepthTexture, Vector3, CylinderGeometry, Matrix4, SpotLight as SpotLightImpl } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { SpotLightMaterial } from '../materials/SpotLightMaterial'

type SpotLightProps = JSX.IntrinsicElements['spotLight'] & {
  depthBuffer?: DepthTexture
  attenuation?: number
  anglePower?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
  color?: string | number
}

const vec = new Vector3()
const SpotLight = React.forwardRef(
  (
    {
      opacity = 1,
      radiusTop,
      radiusBottom,
      depthBuffer,
      color = 'white',
      distance = 5,
      angle = 0.15,
      attenuation = 5,
      anglePower = 5,
      ...props
    }: SpotLightProps,
    ref: React.ForwardedRef<SpotLightImpl>
  ) => {
    const mesh = React.useRef<Mesh>(null!)
    const size = useThree((state) => state.size)
    const camera = useThree((state) => state.camera)
    const dpr = useThree((state) => state.viewport.dpr)
    const [material] = React.useState(() => new SpotLightMaterial())

    radiusTop = radiusTop === undefined ? 0.1 : radiusTop
    radiusBottom = radiusBottom === undefined ? angle * 7 : radiusBottom

    useFrame(() => {
      material.uniforms.spotPosition.value.copy(mesh.current.getWorldPosition(vec))
      mesh.current.lookAt((mesh.current.parent as any).target.getWorldPosition(vec))
    })

    const geom = React.useMemo(() => {
      const geometry = new CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true)
      geometry.applyMatrix4(new Matrix4().makeTranslation(0, -distance / 2, 0))
      geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
      return geometry
    }, [angle, distance, radiusTop, radiusBottom])

    return (
      <spotLight ref={ref} angle={angle} color={color} distance={distance} {...props}>
        <mesh ref={mesh} geometry={geom} raycast={() => null}>
          <primitive
            object={material}
            attach="material"
            uniforms-opacity-value={opacity}
            uniforms-lightColor-value={color}
            uniforms-attenuation-value={attenuation}
            uniforms-anglePower-value={anglePower}
            uniforms-depth-value={depthBuffer}
            uniforms-cameraNear-value={camera.near}
            uniforms-cameraFar-value={camera.far}
            uniforms-resolution-value={depthBuffer ? [size.width * dpr, size.height * dpr] : [0, 0]}
          />
        </mesh>
      </spotLight>
    )
  }
)

export { SpotLight }
