import { Bounds, OrbitControls, useBounds } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Mesh, SphereGeometry } from 'three'

//* Bounds Demo ==============================

function BoundsSphere({ pointerMissedCount }: { pointerMissedCount: number }) {
  const sphereRef = useRef<Mesh<SphereGeometry>>(null!)

  const bounds = useBounds()

  const handleClick = useCallback(() => {
    bounds.refresh(sphereRef.current).clip().fit()
  }, [bounds])

  // when offclick happens reset the bounds
  useEffect(() => {
    if (pointerMissedCount > 0) {
      console.log('resetting bounds')
      bounds.reset()
    }
  }, [pointerMissedCount, bounds])

  return (
    <mesh ref={sphereRef} onClick={handleClick}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function Scene({ pointerMissedCount }: { pointerMissedCount: number }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Bounds component - click objects to fit camera */}
      <Bounds fit clip observe margin={1.5}>
        <mesh position={[-2, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        <BoundsSphere pointerMissedCount={pointerMissedCount} />
      </Bounds>

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function BoundsDemo() {
  const [pointerMissedCount, setPointerMissedCount] = useState(0)

  const handlePointerMissed = useCallback(() => {
    setPointerMissedCount(pointerMissedCount + 1)
  }, [pointerMissedCount])
  return (
    <div className="demo-container">
      <ExampleCard demoName="Bounds" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }} onPointerMissed={handlePointerMissed}>
          <Scene pointerMissedCount={pointerMissedCount} />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
