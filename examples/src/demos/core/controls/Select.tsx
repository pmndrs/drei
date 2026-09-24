import { Select, OrbitControls, useSelect, Edges } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'
import type { ThreeElements } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

//* Select Demo ==============================

function SelectableObject(props: ThreeElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null!)
  // useSelect reads the current selection from the enclosing <Select>
  const isSelected = useSelect().includes(ref.current)
  return (
    <mesh ref={ref} {...props}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={isSelected ? 'hotpink' : 'orange'} />
      {/* Edges is Line-based in v11: it is styled through props and takes no material child */}
      {isSelected && <Edges scale={1.1} color="white" lineWidth={2} />}
    </mesh>
  )
}

function Scene() {
  const [selected, setSelected] = useState<THREE.Object3D[]>([])

  useEffect(() => {
    console.log('selected', selected)
  }, [selected])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <Select multiple box onChange={setSelected}>
        <SelectableObject position={[1, 2, 3]} />

        <mesh position={[2, 0.5, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={selected.length > 0 ? 'hotpink' : 'lightblue'} />
        </mesh>

        <mesh position={[-2, 0.5, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
          <meshStandardMaterial color={selected.length > 0 ? 'hotpink' : 'lightgreen'} />
        </mesh>
      </Select>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[10, 10, '#666', '#444']} />

      {/* Selection info */}
      {selected.length > 0 && (
        <group position={[0, 3, 0]}>
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
        </group>
      )}
    </>
  )
}

export default function SelectDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Select" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 5, 5] }}>
          <OrbitControls makeDefault />
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
