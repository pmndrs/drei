import * as React from 'react'
import {
  Vector2,
  Vector3,
  Vector4,
  Color,
  ColorRepresentation,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
} from '#three'
import { useThree, Vector2 as FiberVector2, Vector3 as FiberVector3, ThreeElement } from '@react-three/fiber'
import { LineGeometry, LineMaterial, Line2, LineSegments2 } from '#three-addons'
// hack to be webgpu compatible
import { Line2 as Line2WebGPU } from 'three/examples/jsm/lines/webgpu/Line2.js'
import { LineSegments2 as LineSegments2WebGPU } from 'three/examples/jsm/lines/webgpu/LineSegments2.js'
import { Line2NodeMaterial } from 'three/webgpu'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterialParameters } from 'three/examples/jsm/lines/LineMaterial.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type LineProps = Omit<
  {
    points: ReadonlyArray<FiberVector2 | FiberVector3>
    vertexColors?: ReadonlyArray<Color | [number, number, number] | [number, number, number, number]>
    lineWidth?: number
    segments?: boolean
  } & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
    Omit<ThreeElement<typeof Line2>, 'ref' | 'args'> &
    Omit<ThreeElement<typeof LineMaterial>, 'ref' | 'color' | 'vertexColors' | 'args'> & {
      color?: ColorRepresentation
    },
  'ref'
>

/**
 * Renders a THREE.Line2 or THREE.LineSegments2 (depending on the value of `segments`).
 *
 * @example Basic usage
 * ```jsx
 * <Line
 *   points={[[0, 0, 0], [1, 0, 0], [1, 1, 0]]}
 *   color="black"
 *   lineWidth={1}
 *   segments={false}
 *   dashed={false}
 *   vertexColors={[[0, 0, 0], [1, 0, 0]]} // Optional RGB for each point
 * />
 * ```
 */
export const Line: ForwardRefComponent<LineProps, Line2 | LineSegments2> = /* @__PURE__ */ React.forwardRef<
  Line2 | LineSegments2,
  LineProps
>(function Line({ points, color = 0xffffff, vertexColors, linewidth, lineWidth, segments, dashed, ...rest }, ref) {
  const size = useThree((state) => state.size)
  const line2 = React.useMemo(() => (segments ? new LineSegments2() : new Line2()), [segments])

  const { isLegacy } = useThree()
  const lineMaterial = React.useMemo(() => {
    return isLegacy ? new LineMaterial() : new Line2NodeMaterial()
  }, [isLegacy])
  const itemSize = (vertexColors?.[0] as number[] | undefined)?.length === 4 ? 4 : 3
  const lineGeom = React.useMemo(() => {
    const geom = segments ? new LineSegmentsGeometry() : new LineGeometry()
    const pValues = points.map((p) => {
      const isArray = Array.isArray(p)
      if (p instanceof Vector3) return [(p as Vector3).x, (p as Vector3).y, (p as Vector3).z]
      if (p instanceof Vector4) return [(p as Vector4).x, (p as Vector4).y, (p as Vector4).z]
      if (p instanceof Vector2) return [(p as Vector2).x, (p as Vector2).y, 0]
      if (isArray && p.length === 3) return [p[0], p[1], p[2]]
      if (isArray && p.length === 2) return [p[0], p[1], 0]
      return p
    })

    geom.setPositions(pValues.flat())

    if (vertexColors) {
      // using vertexColors requires the color value to be white see #1813
      color = 0xffffff
      const cValues = vertexColors.map((c) => (c instanceof Color ? c.toArray() : c))

      // LineSegmentsGeometry.setColors only supports RGB (itemSize 3)
      // For RGBA, we need to manually set the attributes
      if (itemSize === 4) {
        const colors = new Float32Array(cValues.flat())
        const instanceColorBuffer = new InstancedInterleavedBuffer(colors, 8, 1) // rgba, rgba
        geom.setAttribute('instanceColorStart', new InterleavedBufferAttribute(instanceColorBuffer, 4, 0))
        geom.setAttribute('instanceColorEnd', new InterleavedBufferAttribute(instanceColorBuffer, 4, 4))
      } else {
        geom.setColors(cValues.flat())
      }
    }

    return geom
  }, [points, segments, vertexColors, itemSize])

  React.useLayoutEffect(() => {
    line2.computeLineDistances()
  }, [points, line2])

  React.useLayoutEffect(() => {
    if (dashed) {
      lineMaterial.dashed = true
    } else {
      lineMaterial.dashed = false
    }
    lineMaterial.needsUpdate = true
  }, [dashed, lineMaterial])

  const { gl } = useThree()

  React.useEffect(() => {
    // Capture refs for cleanup
    const geom = lineGeom
    const mat = lineMaterial
    const isWebGPU = 'isWebGPURenderer' in gl && (gl as any).isWebGPURenderer

    return () => {
      // WebGPU has a command buffer model where dispose() can destroy buffers
      // while queued commands still reference them, causing errors.
      // In WebGPU mode, we skip explicit disposal and let the browser's GC handle it.
      // See: https://discourse.threejs.org/t/web-gpu-buffer-unlabeled-used-in-submit-while-destroyed
      if (isWebGPU) return

      // For WebGL, dispose synchronously as usual
      geom.dispose()
      mat.dispose()
    }
  }, [lineGeom, lineMaterial, gl])

  return (
    <primitive object={line2} ref={ref} {...rest}>
      <primitive object={lineGeom} attach="geometry" />
      <primitive
        object={lineMaterial}
        attach="material"
        color={color}
        vertexColors={Boolean(vertexColors)}
        resolution={[size.width, size.height]}
        linewidth={linewidth ?? lineWidth ?? 1}
        dashed={dashed}
        transparent={itemSize === 4}
        {...rest}
      />
    </primitive>
  )
})
