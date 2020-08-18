import React, { useMemo } from 'react'
import * as THREE from 'three'

import { setupDecorator } from '../setup-decorator'
import { useTurntable } from '../useTurntable'

import { Tube } from '../../src/shapes'

export default {
  title: 'Shapes/Tube',
  component: Tube,
}

export function TubeScene() {
  // curve example from https://threejs.org/docs/#api/en/geometries/TubeGeometry
  const path = useMemo(() => {
    function CustomSinCurve(scale) {
      THREE.Curve.call(this)

      this.scale = scale === undefined ? 1 : scale
    }

    CustomSinCurve.prototype = Object.create(THREE.Curve.prototype)
    CustomSinCurve.prototype.constructor = CustomSinCurve

    CustomSinCurve.prototype.getPoint = function (t) {
      const tx = t * 3 - 1.5
      const ty = Math.sin(2 * Math.PI * t)
      const tz = 0

      return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale)
    }

    return new CustomSinCurve(10)
  }, [])

  const ref = useTurntable()

  return (
    <Tube ref={ref} args={[path]}>
      <meshPhongMaterial attach="material" color="#f3f3f3" wireframe />
    </Tube>
  )
}

TubeScene.storyName = 'Default'
