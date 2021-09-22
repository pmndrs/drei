import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'

type Helper = Object3D & {
  update: () => void
}

export function useHelper<T>(object3D: React.MutableRefObject<Object3D | undefined>, proto: T, ...args: any[]) {
  const helper = React.useRef<Helper>()

  const scene = useThree((state) => state.scene)
  React.useEffect(() => {
    if (proto && object3D.current) {
      helper.current = new (proto as any)(object3D.current, ...args)
      if (helper.current) {
        scene.add(helper.current)
      }
    }

    return () => {
      if (helper.current) {
        scene.remove(helper.current)
      }
    }
  }, [scene, proto, object3D, args])

  useFrame(() => {
    if (helper.current?.update) {
      helper.current.update()
    } else if (helper.current && object3D.current) {
      helper.current.position.copy(object3D.current.position)
      helper.current.quaternion.copy(object3D.current.quaternion)
    }
  })

  return helper
}
