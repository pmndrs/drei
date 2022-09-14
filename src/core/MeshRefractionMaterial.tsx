// Original by N8Programs
// https://twitter.com/N8Programs/status/1569865007042646018
// https://github.com/N8python/diamonds

import * as THREE from 'three'
import * as React from 'react'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { extend, ReactThreeFiber, useThree } from '@react-three/fiber'
import { MeshBVH, SAH } from 'three-mesh-bvh'
import { MeshRefractionMaterial as MeshRefractionMaterial_ } from '../materials/MeshRefractionMaterial'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshRefractionMaterial: typeof MeshRefractionMaterial_
    }
  }
}

type MeshRefractionMaterialProps = JSX.IntrinsicElements['shaderMaterial'] & {
  bounces?: number
  ior?: number
  fresnel?: number
  aberrationStrength?: number
  color?: ReactThreeFiber.Color
  resolution?: ReactThreeFiber.Vector2
  envMap?: THREE.CubeTexture | THREE.Texture
  frames?: number
  near?: number
  far?: number
}

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
  def && (def as THREE.CubeTexture).isCubeTexture

export function MeshRefractionMaterial({
  frames = 1,
  resolution = 256,
  near = 0.1,
  far = 1000,
  aberrationStrength = 0,
  envMap,
  ...props
}: MeshRefractionMaterialProps) {
  extend({ MeshRefractionMaterial: MeshRefractionMaterial_ })

  const material = useRef()
  const { size } = useThree()

  const defines = useMemo(() => {
    const temp = {} as { [key: string]: string }
    if (envMap) {
      const isCubeMap = isCubeTexture(envMap)
      const w = (isCubeMap ? envMap.image[0]?.width : envMap.image.width) ?? 1024
      const cubeSize = w / 4
      const _lodMax = Math.floor(Math.log2(cubeSize))
      const _cubeSize = Math.pow(2, _lodMax)
      const width = 3 * Math.max(_cubeSize, 16 * 7)
      const height = 4 * _cubeSize

      if (isCubeMap) temp.ENVMAP_TYPE_CUBEM = ''
      temp.CUBEUV_TEXEL_WIDTH = `${1.0 / width}`
      temp.CUBEUV_TEXEL_HEIGHT = `${1.0 / height}`
      temp.CUBEUV_MAX_MIP = `${_lodMax}.0`
    }
    if (aberrationStrength > 0) temp.CHROMATIC_ABERRATIONS = ''
    return temp
  }, [aberrationStrength])

  useLayoutEffect(() => {
    const geometry = (material.current as any)?.__r3f?.parent?.geometry
    if (geometry)
      (material.current as any).bvh.updateFrom(
        new MeshBVH(geometry.toNonIndexed(), { lazyGeneration: false, strategy: SAH })
      )
  }, [])

  return (
    <meshRefractionMaterial
      // @ts-ignore
      key={JSON.stringify(!!aberrationStrength)}
      // @ts-ignore
      defines={defines}
      ref={material}
      resolution={[size.width, size.height]}
      aberrationStrength={aberrationStrength}
      envMap={envMap}
      {...props}
    />
  )
}
