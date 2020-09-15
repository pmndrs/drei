import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { useLoader } from 'react-three-fiber'
import { Group } from 'three'

export function useFBXLoader(path: string): Group {
  const fbx = useLoader<Group>(FBXLoader, path)
  return fbx
}
