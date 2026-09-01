import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei/core'
import type { ReactNode } from 'react'

//* Scene Template ==============================

interface SceneProps {
  children?: ReactNode
  camera?: {
    position?: [number, number, number]
    fov?: number
  }
  showOrbitControls?: boolean
}

export default function Scene({
  children,
  camera = { position: [5, 5, 5], fov: 50 },
  showOrbitControls = true,
}: SceneProps) {
  return (
    <Canvas camera={camera}>
      {/* Lighting --------------------------------- */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Grid Helper --------------------------------- */}
      {/*
        `Grid` used to be imported from `@react-three/drei/core` and rendered
        here. It is not in `core` — it exists only in `legacy` and `webgpu`, so
        the import resolved to undefined and this block would have thrown the
        moment anything used this template. Nothing did.

        A renderer-agnostic template cannot statically import a renderer-split
        component. The working pattern is in `demos/core/staging/Grid.tsx`:
        import both implementations and choose with `PlatformSwitch`.
        See #2808.
      */}

      {/* Controls --------------------------------- */}
      {showOrbitControls && <OrbitControls makeDefault />}

      {/* Scene Content --------------------------------- */}
      {children}
    </Canvas>
  )
}
