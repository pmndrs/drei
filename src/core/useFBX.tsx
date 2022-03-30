import { FBXLoader } from 'three-stdlib'
import { useLoader } from '@react-three/fiber'
import { Group } from 'three'

export function useFBX(path: string): Group {
  return useLoader(FBXLoader, path)
}

useFBX.preload = (path: string) => useLoader.preload(FBXLoader, path)
useFBX.clear = (input: string | string[]) => useLoader.clear(FBXLoader, input)
