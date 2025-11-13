import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import './styles.css'
import { createRoot } from 'react-dom/client'

function Thing() {
  const ref = useRef(null)
  useFrame(() => {
    ref.current.rotation.x = ref.current.rotation.y += 0.01
  })
  return (
    <mesh
      ref={ref}
      onClick={(e) => console.log('click')}
      onPointerOver={(e) => console.log('hover')}
      onPointerOut={(e) => console.log('unhover')}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  )
}

createRoot(document.getElementById('root')).render(
  <Canvas>
    <Thing />
  </Canvas>
)
