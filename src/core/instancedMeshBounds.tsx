import { Position } from '../helpers/Position'
import { Ray, Raycaster, Intersection, Vector3, Matrix4 } from 'three'

const _inverseMatrix = new Matrix4()
const _ray = new Ray()
const _vA = new Vector3()
const _instanceLocalMatrix = new Matrix4()
const _instanceWorldMatrix = new Matrix4()

export function instancedMeshBounds(this: Position, raycaster: Raycaster, intersects: Intersection[]) {
  const parent = this.instance.current
  if (!parent) return
  if (!parent.geometry || !parent.material) return

  const geometry = parent.geometry
  const parentMatrixWorld = parent.matrixWorld
  const instanceId = parent.userData.instances.indexOf(this.instanceKey)
  if (instanceId === -1) return
  // calculate the world matrix for each instance
  parent.getMatrixAt(instanceId, _instanceLocalMatrix)
  _instanceWorldMatrix.multiplyMatrices(parentMatrixWorld, _instanceLocalMatrix)
  const matrixWorld = _instanceWorldMatrix
  _inverseMatrix.copy(matrixWorld).invert()
  _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix)
  // Check boundingBox before continuing
  if (geometry.boundingBox !== null && _ray.intersectBox(geometry.boundingBox, _vA) === null) return
  intersects.push({
    distance: _vA.distanceTo(raycaster.ray.origin),
    point: _vA.clone(),
    object: this,
    instanceId: instanceId,
  })
}
