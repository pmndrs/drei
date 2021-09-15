import * as THREE from 'three'
import { ReactThreeFiber } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      position: ReactThreeFiber.Object3DNode<Position, typeof Position>
    }
  }
}

export class Position extends THREE.Group {
  color: THREE.Color
  constructor() {
    super()
    this.color = new THREE.Color('white')
  }
}
