import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Falsey } from 'utility-types'

type Helper = Object3D & {
  update: () => void
}
type Constructor = new (...args: any[]) => any
type Rest<T> = T extends [infer _, ...infer R] ? R : never

export function useHelper<T extends Constructor>(
  object3D: React.MutableRefObject<Object3D | null | undefined> | Falsey | undefined,
  helperConstructor: T,
  ...args: Rest<ConstructorParameters<T>>
) {
  const helper = React.useRef<Helper>()

  const scene = useThree((state) => state.scene)
  React.useEffect(() => {
    if (object3D) {
      if (helperConstructor && object3D?.current) {
        helper.current = new (helperConstructor as any)(object3D.current, ...args)
        if (helper.current) {
          scene.add(helper.current)
        }
      }
    }

    /**
     * Dispose of the helper if no object 3D is passed
     */
    if (!object3D && helper.current) {
      scene.remove(helper.current)
    }

    return () => {
      if (helper.current) {
        scene.remove(helper.current)
      }
    }
  }, [scene, helperConstructor, object3D, ...args])

  useFrame(() => {
    if (helper.current?.update) {
      helper.current.update()
    }
  })

  return helper
}
