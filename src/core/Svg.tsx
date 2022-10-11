import { Object3DProps, useLoader } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, Fragment, useMemo } from 'react'
import { Color, DoubleSide, MeshBasicMaterial, Object3D } from 'three'
import { SVGLoader } from 'three-stdlib'

export interface SvgProps extends Object3DProps {
  /** src can be a URL or SVG data */
  src: string
  skipFill?: boolean
  skipStrokes?: boolean
  strokesWireframe?: boolean
  fillWireframe?: boolean
}

export const Svg = forwardRef<Object3D, SvgProps>(function R3FSvg(
  { src, skipFill, skipStrokes, strokesWireframe, fillWireframe, ...props },
  ref
) {
  const svg = useLoader(SVGLoader, !src.startsWith('<svg') ? src : `data:image/svg+xml;utf8,${src}`)

  const shapeGroups = useMemo(
    () => (skipFill ? [] : svg.paths.map((path) => SVGLoader.createShapes(path))),
    [svg, skipFill]
  )

  const fillMaterials = useMemo(
    () =>
      skipFill
        ? []
        : svg.paths.map(
            (path) =>
              new MeshBasicMaterial({
                color: new Color()
                  .setStyle(path.userData!.style.fill === 'none' ? '#000000' : path.userData!.style.fill)
                  .convertSRGBToLinear(),
                opacity: path.userData!.style.fillOpacity,
                transparent: true,
                side: DoubleSide,
                depthWrite: false,
                wireframe: fillWireframe,
              })
          ),
    [svg, skipFill, fillWireframe]
  )

  const strokeMaterials = useMemo(
    () =>
      skipStrokes
        ? []
        : svg.paths.map(
            (path) =>
              new MeshBasicMaterial({
                color: new Color()
                  .setStyle(path.userData!.style.stroke === 'none' ? '#000000' : path.userData!.style.stroke)
                  .convertSRGBToLinear(),
                opacity: path.userData!.style.strokeOpacity,
                transparent: true,
                side: DoubleSide,
                depthWrite: false,
                wireframe: strokesWireframe,
              })
          ),
    [svg, skipStrokes, strokesWireframe]
  )

  const strokeGeometryGroups = useMemo(
    () =>
      svg.paths.map((path) =>
        skipStrokes
          ? []
          : path.subPaths.map((subPath) => SVGLoader.pointsToStroke(subPath.getPoints(), path.userData!.style))
      ),
    [svg, skipStrokes]
  )

  return (
    <object3D ref={ref} {...props}>
      <object3D scale={[1, -1, 1]}>
        {strokeGeometryGroups.map((geometries, i) =>
          geometries.map((geometry, x) =>
            !geometry ? (
              <Fragment key={`${i}.${x}`} />
            ) : (
              <mesh key={`${i}.${x}`} geometry={geometry} material={strokeMaterials[i]} />
            )
          )
        )}

        {shapeGroups.map((shapes, x) =>
          shapes.map((shape, y) => (
            <mesh key={`${x}.${y}`} material={fillMaterials[x]}>
              <shapeGeometry args={[shape]} />
            </mesh>
          ))
        )}
      </object3D>
    </object3D>
  )
})
