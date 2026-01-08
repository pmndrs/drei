import { BBAnchor, Html, Icosahedron, OrbitControls, Text, Text3D, useHelper } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { ComponentProps } from 'react'
import { Mesh, BoxHelper, IcosahedronGeometry } from 'three'
import { useRef } from 'react'

//* BBAnchor Demo ==============================

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <BBAnchorScene />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

function BBAnchorScene() {
  const ref = useRef<Mesh<IcosahedronGeometry>>(null!)

  useHelper(ref, BoxHelper, 'cyan')

  return (
    <>
      <OrbitControls autoRotate />
      <Icosahedron ref={ref}>
        <meshBasicMaterial color="hotpink" wireframe />
        <BBAnchor anchor={[1, 1, 1]}>
          <Html
            style={{
              color: 'white',
              whiteSpace: 'nowrap',
            }}
            center
          >
            Html element
          </Html>
        </BBAnchor>
      </Icosahedron>
    </>
  )
}

export default function BBAnchorDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="BBAnchor" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
