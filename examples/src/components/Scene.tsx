import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei/core'
import type { ReactNode } from 'react'

//* Scene Template ==============================

interface SceneProps {
  children?: ReactNode
  camera?: {
    position?: [number, number, number]
    fov?: number
  }
  showGrid?: boolean
  showOrbitControls?: boolean
}

export default function Scene({
  children,
  camera = { position: [5, 5, 5], fov: 50 },
  showGrid = true,
  showOrbitControls = true,
}: SceneProps) {
  return (
    <Canvas camera={camera}>
      {/* Lighting --------------------------------- */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Grid Helper --------------------------------- */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellColor="#6f6f6f"
          sectionSize={5}
          sectionColor="#9d4b4b"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Controls --------------------------------- */}
      {showOrbitControls && <OrbitControls makeDefault />}

      {/* Scene Content --------------------------------- */}
      {children}
    </Canvas>
  )
}
