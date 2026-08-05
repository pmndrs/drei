import * as THREE from 'three'

export type CameraViewObject = THREE.Mesh | THREE.Line | THREE.Points

const viewMatrixInverse = /* @__PURE__ */ new THREE.Matrix4()
const viewProjection = /* @__PURE__ */ new THREE.Matrix4()
const frustum = /* @__PURE__ */ new THREE.Frustum()

export function isObjectInCameraView(object: CameraViewObject, camera: THREE.Camera) {
  for (let current: THREE.Object3D | null = object; current; current = current.parent) {
    if (!current.visible) return false
  }

  if (!object.layers.test(camera.layers)) return false
  if (!object.frustumCulled) return true

  object.updateWorldMatrix(true, false)
  camera.updateWorldMatrix(true, false)
  viewMatrixInverse.copy(camera.matrixWorld).invert()
  viewProjection.multiplyMatrices(camera.projectionMatrix, viewMatrixInverse)
  frustum.setFromProjectionMatrix(viewProjection, camera.coordinateSystem)
  return frustum.intersectsObject(object)
}
