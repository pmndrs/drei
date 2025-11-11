import * as React from 'react'
import { FBXLoader } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'
import { Group } from 'three'

import { Clone } from '../Clone'

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
