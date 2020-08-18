import React, { useMemo } from 'react'
import * as THREE from 'three'

import { setupDecorator } from '../setup-decorator'
import { useTurntable } from '../useTurntable'

import { Lathe } from '../../src/shapes'

export default {
  title: 'Shapes/Lathe',
  component: Lathe,
  decorators: [
    setupDecorator(),
  ],
}

function LatheScene() {
  const points = useMemo(() => {
    const _points = []
    for (let i = 0; i < 10; i++) {
      _points.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2))
    }

    return _points
  }, [])

  const ref = useTurntable()

  return (
    <Lathe ref={ref} args={[points]}>
      <meshPhongMaterial attach="material" color="#f3f3f3" wireframe />
    </Lathe>
  )
}

export const LatheSt = () => <LatheScene />
LatheSt.storyName = 'Default'
