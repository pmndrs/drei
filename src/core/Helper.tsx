import { useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import { Object3D } from 'three'

type HelperType = Object3D & { update: () => void; dispose: () => void }
type HelperConstructor = new (...args: any[]) => HelperType
type HelperArgs<T> = T extends [infer _, ...infer R] ? R : never

export type HelperProps<T extends HelperConstructor> = {
  type: T
  args?: HelperArgs<ConstructorParameters<T>>
}

export const Helper = <T extends HelperConstructor>({
  type: helperConstructor,
  args = [] as never,
}: HelperProps<T>) => {
  const objectRef = React.useRef<Object3D>(null!)
  const helperRef = React.useRef<HelperType>()

  const scene = useThree((state) => state.scene)

  React.useLayoutEffect(() => {
    const parent = objectRef.current?.parent

    if (!helperConstructor || !parent) return

    const helper = new helperConstructor(parent, ...args)

    helperRef.current = helper

    // Prevent the helpers from blocking rays
    helper.traverse((child) => (child.raycast = () => null))

    scene.add(helper)

    return () => {
      helperRef.current = undefined
      scene.remove(helper)
      helper.dispose?.()
    }
  }, [scene, helperConstructor, ...args])

  useFrame(() => void helperRef.current?.update?.())

  return <object3D ref={objectRef} />
}
