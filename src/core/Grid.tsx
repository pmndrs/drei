/** Original grid component https://github.com/threlte/threlte/blob/main/packages/extras/src/lib/components/Grid/Grid.svelte
 *  By https://github.com/grischaerbe and https://github.com/jerzakm
 */

import * as React from 'react'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'

export type GridMaterialType = {
  cellColor?: THREE.ColorRepresentation
  cellSize?: number
  cellThickness?: number
  sectionColor?: THREE.ColorRepresentation
  sectionSize?: number
  sectionThickness?: number
  followCamera?: boolean
  infiniteGrid?: boolean
  fadeDistance?: number
  fadeStrength?: number
}

export type GridProps = GridMaterialType & {
  gridSize?: number | [number, number]
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      gridMaterial: JSX.IntrinsicElements['shaderMaterial'] & GridMaterialType
    }
  }
}

const GridMaterial = shaderMaterial(
  {
    cellSize: 1,
    sectionSize: 10,
    fadeDistance: 100,
    fadeStrength: 1,
    cellThickness: 1,
    sectionThickness: 2,
    cellColor: new THREE.Color('#000000'),
    sectionColor: new THREE.Color('#2080ff'),
    infiniteGrid: 0,
    followCamera: 0,
  },
  ` varying vec3 worldPosition;
      uniform float fadeDistance;
      uniform float infiniteGrid;
      uniform float followCamera;
      void main() {
        vec3 pos = position.xz * (1. + fadeDistance * infiniteGrid);
        pos.xz += (cameraPosition.xz * followCamera);
        worldPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }`,
  ` varying vec3 worldPosition;
      uniform float cellSize;
      uniform float sectionSize;
      uniform vec3 cellColor;
      uniform vec3 sectionColor;
      uniform float fadeDistance;
      uniform float fadeStrength;
      uniform float cellThickness;
      uniform float sectionThickness;
      uniform float infiniteGrid;
      float getGrid(float size, float thickness) {
        vec2 r = worldPosition.xz / size;
        vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
        float line = min(grid.x, grid.y) + 1. - thickness;
        return 1.0 - min(line, 1.);
      }
      void main() {
        float g1 = getGrid(cellSize, cellThickness);
        float g2 = getGrid(sectionSize, sectionThickness);
        float d = 1.0 - min(distance(cameraPosition.xz, worldPosition.xz) / fadeDistance, 1.);
        vec3 color = mix(cellColor, sectionColor, min(1.,sectionThickness * g2));
        gl_FragColor = vec4(color, (g1 + g2) * pow(d,fadeStrength));
        gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
        if (gl_FragColor.a <= 0.0) discard;
      }`,
  (material) => {
    Object.assign(material!, {
      side: THREE.DoubleSide,
      transparent: true,
      extensions: { derivatives: true },
    })
  }
)

export const Grid = React.forwardRef(
  (
    {
      gridSize = 20,
      cellColor = '#000000',
      sectionColor = '#2080ff',
      cellSize = 1,
      sectionSize = 10,
      followCamera = false,
      infiniteGrid = false,
      fadeDistance = 100,
      fadeStrength = 1,
      cellThickness = 1,
      sectionThickness = 2,
      ...props
    }: JSX.IntrinsicElements['mesh'] & GridProps,
    fRef: React.ForwardedRef<THREE.Mesh>
  ) => {
    extend({ GridMaterial })
    const uniforms = {
      cellSize,
      sectionSize,
      cellColor,
      sectionColor,
      fadeDistance,
      fadeStrength,
      cellThickness,
      sectionThickness,
      infiniteGrid,
      followCamera,
    }
    return (
      <mesh ref={fRef} rotation-x={-Math.PI / 2} frustumCulled={false} {...props}>
        <gridMaterial {...uniforms} />
        <planeGeometry args={typeof gridSize == 'number' ? [gridSize, gridSize] : gridSize} />
      </mesh>
    )
  }
)
