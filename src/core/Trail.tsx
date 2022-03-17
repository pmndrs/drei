import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import { ColorRepresentation, Group, Object3D, Vector2, Vector3 } from 'three'

// @ts-ignore
import { MeshLine, MeshLineMaterial } from 'three.meshline'

interface TrailProps {
  width?: number
  color?: ColorRepresentation
  length?: number
  decay?: number
  attenuation?: (width: number) => number
  target?: React.MutableRefObject<Object3D>
}

const shiftLeft = (collection, steps = 1) => {
  collection.set(collection.subarray(steps))
  collection.fill(-Infinity, -steps)
  return collection
}

export function useTrail(target: React.MutableRefObject<Object3D>, length: number = 1, decay: number = 1) {
  const points = React.useRef<Float32Array>(Float32Array.from({ length: length * 3 }, () => 0))

  React.useLayoutEffect(() => {
    points.current = Float32Array.from({ length: length * 3 }, () => 0)
  }, [length])

  useFrame(() => {
    if (!target.current) return

    const n = target.current.position.clone()

    shiftLeft(points.current, 3)
    points.current.set(n.toArray(), points.current.length - 3)
  })

  return points
}

export const Trail = React.forwardRef<MeshLine, React.PropsWithChildren<TrailProps>>(
  ({ width = 0.2, color = 'purple', length = 1, decay = 1, attenuation, target, children }, forwardRef) => {
    const size = useThree((s) => s.size)

    const ref = React.useRef<Group>(null!)
    const anchor = React.useRef<Object3D>(null!)

    const points = useTrail(anchor, length, decay)

    React.useLayoutEffect(() => {
      const t =
        target?.current ||
        ref.current.children.find((o) => {
          return o instanceof Object3D
        })
      if (t) {
        anchor.current = t
      }
    }, [points, target])

    const geo = React.useMemo(() => new MeshLine(), [])
    const mat = React.useMemo(() => {
      const m = new MeshLineMaterial({
        lineWidth: 0.1 * width,
        color: color,
        sizeAttenuation: true,
        resolution: new Vector2(size.width, size.height),
      })

      if (Array.isArray(children)) {
        const matOverride = children.find(
          (child: React.ReactNode) =>
            // @ts-ignore
            typeof child.type === 'string' && child.type === 'meshLineMaterial'
        )

        // @ts-ignore
        if (typeof matOverride?.props === 'object') {
          // @ts-ignore
          m.setValues(matOverride.props)
        }
      }

      return m
    }, [width, color, size, children])

    React.useEffect(() => {
      mat.uniforms.resolution.value.set(size.width, size.height)
    }, [size])

    useFrame(() => {
      geo.setPoints(points.current, attenuation)
    })

    return (
      <group>
        <mesh ref={forwardRef} geometry={geo} material={mat} />
        <group ref={ref}>{children}</group>
      </group>
    )
  }
)
