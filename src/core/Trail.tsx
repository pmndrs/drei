import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import { ColorRepresentation, Group, Object3D, Vector2, Vector3 } from 'three'

// @ts-ignore
import { MeshLine, MeshLineMaterial } from 'meshline'

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

export function useTrail(target: Object3D, length: number = 1, decay: number = 1, local = false) {
  const points = React.useRef<Float32Array>()
  const [worldPosition] = React.useState(() => new Vector3())

  React.useLayoutEffect(() => {
    if (target) {
      points.current = Float32Array.from({ length: length * 1000 * 3 }, (_, i) => target.position.getComponent(i % 3))
    }
  }, [length, target])

  useFrame(() => {
    if (!target) return
    if (!points.current) return

    let newPosition: Vector3
    if (local) {
      newPosition = target.position
    } else {
      target.getWorldPosition(worldPosition)
      newPosition = worldPosition
    }

    const steps = 100 * decay
    for (let i = 0; i < steps; i++) {
      shiftLeft(points.current, 3)
      points.current.set(newPosition.toArray(), points.current.length - 3)
    }
  })

  return points
}

export const Trail = React.forwardRef<MeshLine, React.PropsWithChildren<TrailProps>>(
  ({ width = 0.2, color = 'hotpink', length = 1, decay = 1, attenuation, target, children }, forwardRef) => {
    const size = useThree((s) => s.size)

    const ref = React.useRef<Group>(null!)
    const [anchor, setAnchor] = React.useState<Object3D>(null!)

    const points = useTrail(anchor, length, decay)

    React.useEffect(() => {
      const t =
        target?.current ||
        ref.current.children.find((o) => {
          return o instanceof Object3D
        })

      if (t) {
        setAnchor(t)
      }
    }, [points, target])

    const geo = React.useMemo(() => new MeshLine(), [])
    const mat = React.useMemo(() => {
      const m = new MeshLineMaterial({
        lineWidth: 0.1 * width,
        color: color,
        sizeAttenuation: 1,
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
