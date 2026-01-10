import * as React from 'react'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { useLoader } from '@react-three/fiber'
import { Group } from '#three'

import { Clone } from '../../Helpers/Clone/Clone'

/**
 * Loads an FBX model using THREE's FBXLoader.
 *
 * @example Basic usage
 * ```jsx
 * const fbx = useFBX('/model.fbx')
 * return <primitive object={fbx} />
 * ```
 */
export function useFBX(path: string): Group {
  return useLoader(FBXLoader, path)
}

useFBX.preload = (path: string) => useLoader.preload(FBXLoader, path)
useFBX.clear = (input: string | string[]) => useLoader.clear(FBXLoader, input)

export function Fbx({
  path,
  ...props
}: { path: Parameters<typeof useFBX>[0] } & Omit<React.ComponentProps<typeof Clone>, 'object'>) {
  const fbx = useFBX(path)

  const object = fbx.children[0]

  return <Clone {...props} object={object} />
}
