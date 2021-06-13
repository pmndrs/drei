import * as React from 'react'
import { Mesh, Object3D } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'

export interface BVHOptions {
  splitStrategy?: 'CENTER' | 'AVERAGE' | 'SAH'
  verbose?: boolean
  setBoundingBox?: boolean
  maxDepth?: number
  maxLeafTris?: number
}

export function useBVH(object3D: React.MutableRefObject<Mesh | undefined>, options?: BVHOptions) {
  const ref = React.useRef<Object3D>()

  React.useEffect(() => {
    if (object3D.current) {
      object3D.current.raycast = acceleratedRaycast
      let geometry: any = object3D.current.geometry
      geometry.computeBoundsTree = computeBoundsTree
      geometry.disposeBoundsTree = disposeBoundsTree
      geometry.computeBoundsTree(options)

      return () => {
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree()
        }
      }
    }
  }, [object3D, options])

  return ref
}
