import { DragControls, OrbitControls } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import { useState } from 'react'

//* DragControls Demo ==============================

function DraggableObjects() {
  const [hovering, setHovering] = useState(false)

  return (
    <>
      {/* Draggable Box */}
      <DragControls onHover={setHovering}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={hovering ? 'hotpink' : 'orange'} />
        </mesh>
      </DragControls>

      {/* Static objects */}
      <mesh position={[2, 0.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>

      <mesh position={[-2, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="lightgreen" />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[10, 10, '#666', '#444']} />
    </>
  )
}

export default function DragControlsDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="DragControls" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 5, 5] }}>
          <OrbitControls makeDefault />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          <DraggableObjects />
        </CanvasWithToggle>
      </div>
    </div>
  )
}

