import * as React from 'react'
import * as THREE from 'three'
import { useFrame, useLoader } from 'react-three-fiber'

import { Setup } from '../Setup'

import { CurveModifier, CurveModifierRef } from '../../src'

export default {
  title: 'Modifiers/CurveModifier',
  component: CurveModifier,
  decorators: [(storyFn) => <Setup>{storyFn()}</Setup>],
}

function CurveModifierScene() {
  const curveRef = React.useRef<CurveModifierRef>()
  const geomRef = React.useRef<THREE.TextGeometry>(null!)
  const font = useLoader(THREE.FontLoader, '/fonts/helvetiker_regular.typeface.json')

  const handlePos = React.useMemo(
    () =>
      [
        { x: 10, y: 0, z: -10 },
        { x: 10, y: 0, z: 10 },
        { x: -10, y: 0, z: 10 },
        { x: -10, y: 0, z: -10 },
      ].map((hand) => new THREE.Vector3(...Object.values(hand))),
    []
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

  React.useEffect(() => {
    geomRef.current.rotateX(Math.PI)
  }, [])

  return (
    <>
      <CurveModifier ref={curveRef} curve={curve}>
        <mesh>
          <textGeometry
            args={[
              'hello @react-three/drei',
              {
                font,
                size: 1,
                height: 1,
              },
            ]}
            ref={geomRef}
          />
          <meshNormalMaterial attach="material" />
        </mesh>
      </CurveModifier>
      <primitive object={line} />
    </>
  )
}

export const CurveModifierSt = () => (
  <React.Suspense fallback={null}>
    <CurveModifierScene />
  </React.Suspense>
)
CurveModifierSt.storyName = 'Default'
