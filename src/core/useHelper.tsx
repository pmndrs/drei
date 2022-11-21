import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Falsey } from 'utility-types'

type Helper = Object3D & { update: () => void; dispose: () => void }
type Constructor = new (...args: any[]) => any
type Rest<T> = T extends [infer _, ...infer R] ? R : never

export function useHelper<T extends Constructor>(
  object3D: React.MutableRefObject<Object3D> | Falsey,
  helperConstructor: T,
  ...args: Rest<ConstructorParameters<T>>
) {
  const helper = React.useRef<Helper>()
  const scene = useThree((state) => state.scene)
  React.useEffect(() => {
    let currentHelper: Helper = undefined!

    if (object3D && object3D?.current && helperConstructor) {
      helper.current = currentHelper = new (helperConstructor as any)(object3D.current, ...args)
    }

    if (currentHelper) {
      scene.add(currentHelper)
      return () => {
        helper.current = undefined
        scene.remove(currentHelper)
        currentHelper.dispose?.()
      }
    }
  }, [scene, helperConstructor, object3D, ...args])

  useFrame(() => void helper.current?.update?.())
  return helper
}
