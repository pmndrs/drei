import { useIntersect, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useCallback, useState } from 'react'

//* useIntersect Demo ==============================

function IntersectingMesh() {
  const [visible, setVisible] = useState(false)
  const handleVisible = useCallback((isVisible: boolean) => {
    setVisible(isVisible)
    console.log('isVisible', isVisible)
  }, [])

  // useIntersect detects when object is in view
  const ref = useIntersect((isVisible) => handleVisible(isVisible))

  return (
    <mesh ref={ref} name="testMesh">
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={visible ? 'hotpink' : 'gray'} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <IntersectingMesh />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function UseIntersectDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="useIntersect" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
