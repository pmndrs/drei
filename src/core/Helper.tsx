import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Falsey } from 'utility-types'

type HelperType = Object3D & { update: () => void; dispose: () => void }
type HelperConstructor = new (...args: any[]) => any
type HelperArgs<T> = T extends [infer _, ...infer R] ? R : never

export function useHelper<T extends HelperConstructor>(
  object3D: React.MutableRefObject<Object3D> | Falsey,
  helperConstructor: T,
  ...args: HelperArgs<ConstructorParameters<T>>
) {
  const helper = React.useRef<HelperType>()
  const scene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    let currentHelper: HelperType = undefined!

    if (object3D && object3D?.current && helperConstructor) {
      helper.current = currentHelper = new (helperConstructor as any)(object3D.current, ...args)
    }

    if (currentHelper) {
      // Prevent the helpers from blocking rays
      currentHelper.traverse((child) => (child.raycast = () => null))
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

//

/**
 * Creates a THREE helper for the parent object.
 *
 * Unlike `useHelper`, you don't need to pass a ref: one for the parent will be automatically created.
 * Internally, it uses `useHelper`
 *
 * @example
 * ```jsx
 * <Sphere>
 *   <Helper type={BoxHelper} args={['royalblue']} hidden />
 *   <Helper type={VertexNormalsHelper} args={[1, 0xff0000]} />
 * </Sphere>
 * ```
 */

export type HelperProps<T extends HelperConstructor> = {
  /**
   * a THREE `*Helper` class
   *
   * @see https://threejs.org/docs/index.html#api/en/helpers/ArrowHelper
   */
  type: T
  /**
   * arguments for the helper constructor
   */
  args?: HelperArgs<ConstructorParameters<T>>
  /**
   * whether the helper should be hidden
   */
  hidden?: boolean
}

export const Helper = <T extends HelperConstructor>({
  type: helperConstructor,
  args = [] as never,
  hidden = false,
}: HelperProps<T>) => {
  const thisRef = React.useRef<Object3D>(null!)
  const parentRef = React.useRef<Object3D>(null!)

  React.useLayoutEffect(() => {
    parentRef.current = thisRef.current.parent!
  })

  const obj3d = hidden ? false : parentRef
  useHelper(obj3d, helperConstructor, ...args)

  return <object3D ref={thisRef} />
}
