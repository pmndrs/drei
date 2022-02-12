import * as THREE from 'three'
import { ReactThreeFiber } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      position: ReactThreeFiber.Object3DNode<Position, typeof Position>
    }
  }
}

const _instanceLocalMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceWorldMatrix = /*@__PURE__*/ new THREE.Matrix4()
const _instanceIntersects = []
const _mesh = /*@__PURE__*/ new THREE.Mesh()

export class Position extends THREE.Group {
  color: THREE.Color
  instance: React.MutableRefObject<THREE.InstancedMesh | undefined>
  instanceKey: React.MutableRefObject<JSX.IntrinsicElements['position'] | undefined>
  constructor() {
    super()
    this.color = new THREE.Color('white')
    this.instance = { current: undefined }
    this.instanceKey = { current: undefined }
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance.current?.geometry
  }

  // And this will allow the virtual instance to receive events
  raycast(raycaster, intersects) {
    const parent = this.instance.current
    if (!parent) return
    if (!parent.geometry || !parent.material) return
    _mesh.geometry = parent.geometry
    const matrixWorld = parent.matrixWorld
    let instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.count) return
    // calculate the world matrix for each instance
    parent.getMatrixAt(instanceId, _instanceLocalMatrix)
    _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix)
    // the mesh represents this single instance
    _mesh.matrixWorld = _instanceWorldMatrix
    _mesh.raycast(raycaster, _instanceIntersects)
    // process the result of raycast
    for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
      const intersect = _instanceIntersects[i] as any
      intersect.instanceId = instanceId
      intersect.object = this
      intersects.push(intersect)
    }
    _instanceIntersects.length = 0
  }
}
