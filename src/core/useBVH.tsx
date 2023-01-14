import * as React from 'react'
import { Mesh } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh'

export interface BVHOptions {
  splitStrategy?: 'CENTER' | 'AVERAGE' | 'SAH'
  verbose?: boolean
  setBoundingBox?: boolean
  maxDepth?: number
  maxLeafTris?: number
}

export function useBVH(mesh: React.MutableRefObject<Mesh | undefined>, options?: BVHOptions) {
  options = {
    splitStrategy: 'SAH',
    verbose: false,
    setBoundingBox: true,
    maxDepth: 40,
    maxLeafTris: 10,
    ...options,
  }
  React.useEffect(() => {
    if (mesh.current) {
      mesh.current.raycast = acceleratedRaycast
      const geometry: any = mesh.current.geometry
      geometry.computeBoundsTree = computeBoundsTree
      geometry.disposeBoundsTree = disposeBoundsTree
      geometry.computeBoundsTree(options)

      return () => {
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree()
        }
      }
    }
  }, [mesh, JSON.stringify(options)])
}
