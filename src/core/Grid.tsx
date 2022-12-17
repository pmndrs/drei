/** Original grid component https://github.com/threlte/threlte/blob/main/packages/extras/src/lib/components/Grid/Grid.svelte
 *  By https://github.com/grischaerbe and https://github.com/jerzakm
 */

import * as React from 'react'
import * as THREE from 'three'
import { shaderMaterial } from './shaderMaterial'

export type GridProps = {
  axes?: 'xzy' | 'xyz' | 'zyx'
  gridSize?: number | [number, number]
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

export function Grid({
  gridSize = 20,
  cellColor = '#000000',
  sectionColor = '#0000ee',
  cellSize = 1,
  sectionSize = 10,
  axes = 'xzy',
  followCamera = false,
  infiniteGrid = false,
  fadeDistance = 100,
  fadeStrength = 1,
  cellThickness = 1,
  sectionThickness = 2,
  ...props
}: JSX.IntrinsicElements['mesh'] & GridProps) {
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
  const shader = React.useMemo(() => {
    const axis = axes.slice(0, 2)
    return new (shaderMaterial(
      {
        ...uniforms,
        cellColor: new THREE.Color(cellColor),
        sectionColor: new THREE.Color(sectionColor),
        infiniteGrid: infiniteGrid ? 1 : 0,
        followCamera: followCamera ? 1 : 0,
      },
      ` varying vec3 worldPosition;
        uniform float fadeDistance;
        uniform float infiniteGrid;
        uniform float followCamera;
        void main() {
          vec3 pos = position.${axes} * (1. + fadeDistance * infiniteGrid);
          pos.${axis} += (cameraPosition.${axis} * followCamera);
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
          vec2 r = worldPosition.${axis} / size;
          vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
          float line = min(grid.x, grid.y) + 1. - thickness;
          return 1.0 - min(line, 1.);
        }
        void main() {
          float g1 = getGrid(cellSize, cellThickness);
          float g2 = getGrid(sectionSize, sectionThickness);
          float d = 1.0 - min(distance(cameraPosition.${axis}, worldPosition.${axis}) / fadeDistance, 1.);
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
    ))()
  }, [axes])

  return (
    <mesh rotation-x={-Math.PI / 2} frustumCulled={false} {...props}>
      <primitive attach="material" object={shader} {...uniforms} />
      <planeGeometry args={typeof gridSize == 'number' ? [gridSize, gridSize] : gridSize} />
    </mesh>
  )
}
