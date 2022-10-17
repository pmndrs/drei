import { MeshBasicMaterialProps, MeshProps, Object3DProps, useLoader } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, Fragment, useEffect, useMemo } from 'react'
import { DoubleSide, Object3D } from 'three'
import { SVGLoader } from 'three-stdlib'

export interface SvgProps extends Omit<Object3DProps, 'ref'> {
  /** src can be a URL or SVG data */
  src: string
  skipFill?: boolean
  skipStrokes?: boolean
  fillMaterial?: MeshBasicMaterialProps
  strokeMaterial?: MeshBasicMaterialProps
  fillMeshProps?: MeshProps
  strokeMeshProps?: MeshProps
}

export const Svg = forwardRef<Object3D, SvgProps>(function R3FSvg(
  { src, skipFill, skipStrokes, fillMaterial, strokeMaterial, fillMeshProps, strokeMeshProps, ...props },
  ref
) {
  const svg = useLoader(SVGLoader, !src.startsWith('<svg') ? src : `data:image/svg+xml;utf8,${src}`)

  const strokeGeometries = useMemo(
    () =>
      skipStrokes
        ? []
        : svg.paths.map((path) =>
            path.userData?.style.stroke === undefined || path.userData.style.stroke === 'none'
              ? null
              : path.subPaths.map((subPath) => SVGLoader.pointsToStroke(subPath.getPoints(), path.userData!.style))
          ),
    [svg, skipStrokes]
  )

  useEffect(() => {
    return () => strokeGeometries.forEach((group) => group && group.map((g) => g.dispose()))
  }, [strokeGeometries])

  return (
    <object3D ref={ref} {...props}>
      <object3D scale={[1, -1, 1]}>
        {svg.paths.map((path, p) => (
          <Fragment key={p}>
            {!skipFill &&
              path.userData?.style.fill !== undefined &&
              path.userData.style.fill !== 'none' &&
              SVGLoader.createShapes(path).map((shape, s) => (
                <mesh key={s} {...fillMeshProps}>
                  <shapeGeometry args={[shape]} />
                  <meshBasicMaterial
                    color={path.userData!.style.fill}
                    opacity={path.userData!.style.fillOpacity}
                    transparent={true}
                    side={DoubleSide}
                    depthWrite={false}
                    {...fillMaterial}
                  />
                </mesh>
              ))}
            {!skipStrokes &&
              path.userData?.style.stroke !== undefined &&
              path.userData.style.stroke !== 'none' &&
              path.subPaths.map((_subPath, s) => (
                <mesh key={s} geometry={strokeGeometries[p]![s]} {...strokeMeshProps}>
                  <meshBasicMaterial
                    color={path.userData!.style.stroke}
                    opacity={path.userData!.style.strokeOpacity}
                    transparent={true}
                    side={DoubleSide}
                    depthWrite={false}
                    {...strokeMaterial}
                  />
                </mesh>
              ))}
          </Fragment>
        ))}
      </object3D>
    </object3D>
  )
})
