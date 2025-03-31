/**
 * Integration and compilation: Faraz Shaikh (https://twitter.com/CantBeFaraz)
 *
 * Based on:
 *  - https://gkjohnson.github.io/threejs-sandbox/screendoor-transparency/ by Garrett Johnson (https://github.com/gkjohnson)
 *
 * Note:
 *  - Must depreciate in favor of https://github.com/mrdoob/three.js/issues/10600 when it's ready.
 */

import { useFrame } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'

export interface ShadowAlphaProps {
  opacity?: number
  alphaMap?: THREE.Texture | boolean
}

export function ShadowAlpha({ opacity, alphaMap }: ShadowAlphaProps) {
  const depthMaterialRef = React.useRef<THREE.MeshDepthMaterial>(null!)
  const distanceMaterialRef = React.useRef<THREE.MeshDistanceMaterial>(null!)

  const uShadowOpacity = React.useRef({
    value: 1,
  })

  const uAlphaMap = React.useRef({
    value: null,
  })

  const uHasAlphaMap = React.useRef({
    value: false,
  })

  React.useLayoutEffect(() => {
    depthMaterialRef.current.onBeforeCompile = distanceMaterialRef.current.onBeforeCompile = (shader) => {
      // Need to get the "void main" line dynamically because the lines for
      // MeshDistanceMaterial and MeshDepthMaterial are different 🤦‍♂️
      const mainLineStart = shader.fragmentShader.indexOf('void main')
      let mainLine = ''
      let ch
      let i = mainLineStart
      while (ch !== '\n' && i < mainLineStart + 100) {
        ch = shader.fragmentShader.charAt(i)
        mainLine += ch
        i++
      }
      mainLine = mainLine.trim()

      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `
        varying vec2 custom_vUv;

        void main() {
          custom_vUv = uv;
          
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        mainLine,
        `
          uniform float uShadowOpacity;
          uniform sampler2D uAlphaMap;
          uniform bool uHasAlphaMap;

          varying vec2 custom_vUv;
  
          float bayerDither2x2( vec2 v ) {
            return mod( 3.0 * v.y + 2.0 * v.x, 4.0 );
          }
    
          float bayerDither4x4( vec2 v ) {
            vec2 P1 = mod( v, 2.0 );
            vec2 P2 = mod( floor( 0.5  * v ), 2.0 );
            return 4.0 * bayerDither2x2( P1 ) + bayerDither2x2( P2 );
          }
  
          void main() {
            float alpha = 
              uHasAlphaMap ? 
                uShadowOpacity * texture2D(uAlphaMap, custom_vUv).x
              : uShadowOpacity;

            if( ( bayerDither4x4( floor( mod( gl_FragCoord.xy, 4.0 ) ) ) ) / 16.0 >= alpha ) discard;
            
          `
      )

      shader.uniforms['uShadowOpacity'] = uShadowOpacity.current
      shader.uniforms['uAlphaMap'] = uAlphaMap.current
      shader.uniforms['uHasAlphaMap'] = uHasAlphaMap.current
    }
  }, [])

  useFrame(() => {
    const parent = (depthMaterialRef.current as any).__r3f?.parent?.object
    if (parent) {
      const parentMainMaterial = parent.material
      if (parentMainMaterial) {
        uShadowOpacity.current.value = opacity ?? parentMainMaterial.opacity

        if (alphaMap === false) {
          uAlphaMap.current.value = null
          uHasAlphaMap.current.value = false
        } else {
          uAlphaMap.current.value = alphaMap || parentMainMaterial.alphaMap
          uHasAlphaMap.current.value = !!uAlphaMap.current.value
        }
      }
    }
  })

  return (
    <>
      <meshDepthMaterial ref={depthMaterialRef} attach="customDepthMaterial" depthPacking={THREE.RGBADepthPacking} />
      <meshDistanceMaterial ref={distanceMaterialRef} attach="customDistanceMaterial" />
    </>
  )
}
