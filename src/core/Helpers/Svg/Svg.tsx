import { useLoader, ThreeElements } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, Fragment, useEffect, useMemo } from 'react'
import { DoubleSide, Object3D } from '#three'
import { SVGLoader, SVGResult, StrokeStyle } from 'three/examples/jsm/loaders/SVGLoader.js'
import type { ShapePath } from '#three'
import { ForwardRefComponent } from '../../../utils/ts-utils'

// three's StrokeStyle omits the presentation attributes SVGLoader actually
// writes onto path.userData.style, and r185 types userData as unknown.
type SvgPathStyle = StrokeStyle & {
  fill?: string
  fillOpacity?: number
  stroke?: string
  strokeOpacity?: number
}

const pathStyle = (path: ShapePath) => (path.userData as { style?: SvgPathStyle } | undefined)?.style

export interface SvgProps extends Omit<ThreeElements['object3D'], 'ref'> {
  /** src can be a URL or SVG data */
  src: string
  skipFill?: boolean
  skipStrokes?: boolean
  fillMaterial?: ThreeElements['meshBasicMaterial']
  strokeMaterial?: ThreeElements['meshBasicMaterial']
  fillMeshProps?: ThreeElements['mesh']
  strokeMeshProps?: ThreeElements['mesh']
}

/**
 * Wrapper around the `three` [svg loader](https://threejs.org/examples/?q=sv#webgl_loader_svg) demo.
 * Accepts an SVG url or svg raw data.
 *
 * @example Basic usage
 * ```jsx
 * <Svg src={urlOrRawSvgString} />
 * ```
 */
export const Svg: ForwardRefComponent<SvgProps, Object3D> = /* @__PURE__ */ forwardRef<Object3D, SvgProps>(
  function R3FSvg(
    { src, skipFill, skipStrokes, fillMaterial, strokeMaterial, fillMeshProps, strokeMeshProps, ...props },
    ref
  ) {
    // Single src returns single SVGResult (not array)
    const svg = useLoader(SVGLoader, !src.startsWith('<svg') ? src : `data:image/svg+xml;utf8,${src}`) as SVGResult

    const strokeGeometries = useMemo(
      () =>
        skipStrokes
          ? []
          : svg.paths.map((path) =>
              pathStyle(path)?.stroke === undefined || pathStyle(path)!.stroke === 'none'
                ? null
                : path.subPaths.map((subPath) => SVGLoader.pointsToStroke(subPath.getPoints(), pathStyle(path)!))
            ),
      [svg, skipStrokes]
    )

    useEffect(() => {
      return () => strokeGeometries.forEach((group) => group && group.map((g) => g.dispose()))
    }, [strokeGeometries])

    let renderOrder = 0

    return (
      <object3D ref={ref} {...props}>
        <object3D scale={[1, -1, 1]}>
          {svg.paths.map((path, p) => (
            <Fragment key={p}>
              {!skipFill &&
                pathStyle(path)?.fill !== undefined &&
                pathStyle(path)!.fill !== 'none' &&
                SVGLoader.createShapes(path).map((shape, s) => (
                  <mesh key={s} {...fillMeshProps} renderOrder={renderOrder++}>
                    <shapeGeometry args={[shape]} />
                    <meshBasicMaterial
                      color={pathStyle(path)!.fill}
                      opacity={pathStyle(path)!.fillOpacity}
                      transparent={true}
                      side={DoubleSide}
                      depthWrite={false}
                      {...fillMaterial}
                    />
                  </mesh>
                ))}
              {!skipStrokes &&
                pathStyle(path)?.stroke !== undefined &&
                pathStyle(path)!.stroke !== 'none' &&
                path.subPaths.map((_subPath, s) => (
                  <mesh key={s} geometry={strokeGeometries[p]![s]} {...strokeMeshProps} renderOrder={renderOrder++}>
                    <meshBasicMaterial
                      color={pathStyle(path)!.stroke}
                      opacity={pathStyle(path)!.strokeOpacity}
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
  }
)
