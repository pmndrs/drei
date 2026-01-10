import { createPortal, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three/webgpu'
import { ColorRepresentation, Group, Object3D, Vector2, Vector3, Line2NodeMaterial } from 'three/webgpu'
import { Line2 } from 'three/examples/jsm/lines/webgpu/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

//* Types & Settings ==============================

type Settings = {
  width: number
  length: number
  decay: number
  /** Whether to use the target's world or local positions */
  local: boolean
  stride: number
  interval: number
}

export type TrailProps = {
  color?: ColorRepresentation
  /** Attenuation function for fading the trail. */
  attenuation?: (t: number) => number
  target?: React.RefObject<Object3D>
} & Partial<Settings>

const defaults: Partial<Settings> = {
  width: 0.2,
  length: 1,
  decay: 1,
  local: false,
  stride: 0,
  interval: 1,
}

//* Utility Functions ==============================

const shiftLeft = (collection: Float32Array, steps = 1): Float32Array => {
  const lastX = collection[collection.length - 3]
  const lastY = collection[collection.length - 2]
  const lastZ = collection[collection.length - 1]

  collection.set(collection.subarray(steps))

  const fillStart = collection.length - steps
  for (let i = fillStart; i < collection.length; i += 3) {
    collection[i] = lastX
    collection[i + 1] = lastY
    collection[i + 2] = lastZ
  }
  return collection
}

//* useTrail Hook ==============================

export function useTrail(target: Object3D, settings: Partial<Settings>, pointCount: number) {
  const { local, decay, interval, stride } = { ...defaults, ...settings } as Settings

  const points = React.useRef<Float32Array>(null!)
  const [worldPosition] = React.useState(() => new Vector3())

  React.useLayoutEffect(() => {
    if (target) {
      const pos = target.position
      points.current = Float32Array.from({ length: pointCount * 3 }, (_, i) => pos.getComponent(i % 3))
    }
  }, [pointCount, target])

  const prevPosition = React.useRef(new Vector3())
  const frameCount = React.useRef(0)

  useFrame(() => {
    if (!target) return
    if (!points.current) return

    if (frameCount.current === 0) {
      let newPosition: Vector3
      if (local) newPosition = target.position
      else {
        target.getWorldPosition(worldPosition)
        newPosition = worldPosition
      }

      const steps = 1 * decay
      for (let i = 0; i < steps; i++) {
        if (newPosition.distanceTo(prevPosition.current) < stride) continue
        shiftLeft(points.current, 3)
        points.current.set(newPosition.toArray(), points.current.length - 3)
      }
      prevPosition.current.copy(newPosition)
    }

    frameCount.current++
    frameCount.current = frameCount.current % interval
  })

  return points
}

//* Trail Component (WebGPU) ==============================

/**
 * A declarative trail effect using Line2.
 * WebGPU version using Line2NodeMaterial.
 */
export const Trail: ForwardRefComponent<React.PropsWithChildren<TrailProps>, Line2> = /* @__PURE__ */ React.forwardRef<
  Line2,
  React.PropsWithChildren<TrailProps>
>((props, forwardRef) => {
  const { children } = props
  const { width, length, decay, local, stride, interval } = { ...defaults, ...props } as Settings
  const { color = 'hotpink', attenuation, target } = props

  const size = useThree((s) => s.size)
  const scene = useThree((s) => s.scene)

  const ref = React.useRef<Group>(null!)
  const [anchor, setAnchor] = React.useState<Object3D>(null!)

  const pointCount = length * 10
  const points = useTrail(anchor, { decay, local, stride, interval }, pointCount)

  React.useEffect(() => {
    const t = target?.current || ref.current.children.find((o) => o instanceof Object3D)
    if (t) setAnchor(t)
  }, [points, target])

  const line = React.useMemo(() => new Line2(), [])

  const geo = React.useMemo(() => {
    const geometry = new LineGeometry()
    const initialPositions = new Float32Array(pointCount * 3).fill(0)
    const initialColors = new Float32Array(pointCount * 3).fill(1)
    geometry.setPositions(initialPositions as unknown as number[])
    geometry.setColors(initialColors as unknown as number[])
    return geometry
  }, [pointCount])

  const [resolution] = React.useState(() => new Vector2(size.width, size.height))

  const colorsRef = React.useRef<Float32Array>(new Float32Array(pointCount * 3))
  const baseColor = React.useMemo(() => new THREE.Color(color), [color])

  const mat = React.useMemo(
    () =>
      new Line2NodeMaterial({
        color: 0xffffff,
        linewidth: width,
        worldUnits: false,
        vertexColors: true,
        transparent: true,
        alphaToCoverage: true,
      }),
    [width]
  )

  React.useEffect(() => {
    resolution.set(size.width, size.height)
    if ('resolution' in mat && (mat as any).resolution?.set) {
      ;(mat as any).resolution.set(size.width, size.height)
    }
  }, [size, mat, resolution])

  useFrame(() => {
    if (!points.current) return

    const count = points.current.length / 3
    const colors = colorsRef.current

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const alpha = attenuation ? attenuation(t) : t
      colors[i * 3 + 0] = baseColor.r * alpha
      colors[i * 3 + 1] = baseColor.g * alpha
      colors[i * 3 + 2] = baseColor.b * alpha
    }

    geo.setPositions(points.current as unknown as number[])
    geo.setColors(colors as unknown as number[])
    line.computeLineDistances()
  })

  React.useLayoutEffect(() => {
    line.geometry = geo
    line.material = mat
  }, [line, geo, mat])

  return (
    <group>
      {createPortal(<primitive object={line} ref={forwardRef} />, scene)}
      <group ref={ref}>{children}</group>
    </group>
  )
})

