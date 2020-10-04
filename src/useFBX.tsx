import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { useLoader } from 'react-three-fiber'
import { Group } from 'three'

export function useFBX(path: string): Group {
  return useLoader<Group>(FBXLoader, path)
}

useFBX.preload = (path: string) => useLoader.preload(FBXLoader, path)
