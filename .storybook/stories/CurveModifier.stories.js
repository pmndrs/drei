import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from 'react-three-fiber'

import { Setup } from '../Setup'

import { Octahedron } from '../../src/shapes'
import CurveModifier from '../../src/CurveModifier'

export default {
  title: 'Modifiers/CurveModifier',
  component: CurveModifier,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function CurveModifierScene() {
  const curveRef = React.useRef()

  const handlePos = React.useMemo(() =>
    [
      { x: 10, y: 0, z: -10 },
      { x: 10, y: 0, z: 10 },
      { x: -10, y: 0, z: 10 },
      { x: -10, y: 0, z: -10 },
    ].map((hand) => new THREE.Vector3(...Object.values(hand)))
  )

  const curve = React.useMemo(() => new THREE.CatmullRomCurve3(handlePos, true, 'centripetal'), [handlePos])

  const line = React.useMemo(
    () =>
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(50)),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
      ),
    [curve]
  )

  useFrame(() => {
    if (curveRef.current) {
      curveRef.current?.moveAlongCurve(0.001)
    }
  })

  return (
    <>
      <CurveModifier ref={curveRef} curve={curve}>
        <Octahedron args={[3, 2]}>
          <meshNormalMaterial attach="material" flatShading color="hotpink" />
        </Octahedron>
      </CurveModifier>
      <primitive object={line} />
    </>
  )
}

export const CurveModifierSt = () => <CurveModifierScene />
CurveModifierSt.storyName = 'Default'
