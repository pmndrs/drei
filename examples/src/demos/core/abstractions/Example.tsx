import { Example, ExampleApi, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useCallback, useRef } from 'react'

//* Example Demo ==============================

function Scene() {
  const apiRef = useRef<ExampleApi>(null)
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      apiRef.current?.decr()
    } else {
      apiRef.current?.incr()
    }
  }, [])
  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Example counter component - click to increment */}
      <Example
        onPointerDown={handleClick}
        ref={apiRef}
        font="/fonts/helvetiker_regular.typeface.json"
        color="hotpink"
        position={[0, 0, 0]}
      />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function ExampleDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Example" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
