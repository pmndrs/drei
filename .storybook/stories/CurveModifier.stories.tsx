import React from 'react'
import { BufferGeometry, CatmullRomCurve3, LineBasicMaterial, LineLoop, Vector3 } from 'three'
import { FontLoader, TextGeometry, TextGeometryParameters } from 'three-stdlib'
import { extend, useFrame, useLoader } from '@react-three/fiber'

import { Setup } from '../Setup'
import { CurveModifier, CurveModifierRef } from '../../src'

extend({ StdText: TextGeometry })

type TextGeometryImpl = JSX.IntrinsicElements['extrudeGeometry'] & {
  args: [string, TextGeometryParameters]
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      stdText: TextGeometryImpl
    }
  }
}

const cameraPosition = new Vector3(0, 10, 20)

export default {
  title: 'Modifiers/CurveModifier',
  component: CurveModifier,
  decorators: [(storyFn) => <Setup cameraPosition={cameraPosition}>{storyFn()}</Setup>],
}

function CurveModifierScene() {
  const curveRef = React.useRef<CurveModifierRef>()
  const geomRef = React.useRef<TextGeometry>(null!)
  const font = useLoader(FontLoader, '/fonts/helvetiker_regular.typeface.json')

  const handlePos = React.useMemo(
    () =>
      [
        { x: 10, y: 0, z: -10 },
        { x: 10, y: 0, z: 10 },
        { x: -10, y: 0, z: 10 },
        { x: -10, y: 0, z: -10 },
      ].map((hand) => new Vector3(...Object.values(hand))),
    []
  )

  const curve = React.useMemo(() => new CatmullRomCurve3(handlePos, true, 'centripetal'), [handlePos])

  const line = React.useMemo(
    () =>
      new LineLoop(new BufferGeometry().setFromPoints(curve.getPoints(50)), new LineBasicMaterial({ color: 0x00ff00 })),
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
          <stdText
            attach="geometry"
            args={[
              // @ts-ignore
              'hello @react-three/drei',
              {
                font,
                size: 2,
                height: 0.05,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 5,
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
