import { useFrame } from '@react-three/fiber'
import { Vector3, Group, OrthographicCamera, Quaternion, Euler } from 'three'
import { RefObject, useMemo } from 'react'

const toObjectVec = /* @__PURE__ */ new Vector3()
const normal = /* @__PURE__ */ new Vector3()

interface useHideCollapsedInputControlsProps {
  objRef: RefObject<Group>
  dir1: Vector3
  dir2: Vector3
  rotation: [number, number, number]
  threshold?: number
}

export function useHideCollapsedInputControls({
  objRef,
  dir1,
  dir2,
  rotation,
  threshold = 0.05,
}: useHideCollapsedInputControlsProps) {
  const quaternion = useMemo(() => {
    const e = new Euler(...rotation)
    return new Quaternion().setFromEuler(e)
  }, [rotation])

  useFrame(({ camera }) => {
    if (!objRef.current) return
    normal.crossVectors(dir1, dir2).normalize().applyQuaternion(quaternion)

    if (camera instanceof OrthographicCamera) {
      // Parallel projection — camera direction is uniform across the scene
      camera.getWorldDirection(toObjectVec)
    } else {
      // Perspective — use the ray from camera to the objects world position
      objRef.current.getWorldPosition(toObjectVec)
      toObjectVec.sub(camera.position).normalize()
    }

    const edgeOnAlignment = Math.abs(toObjectVec.dot(normal))
    objRef.current.visible = edgeOnAlignment > threshold
  })
}
