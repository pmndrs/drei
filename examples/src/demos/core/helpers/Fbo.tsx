import { OrbitControls, Fbo, useFBO, PerspectiveCamera } from '@react-three/drei/core'
import { CanvasWithToggle } from '@ex/components/PlatformSwitch'
import { ExampleCard } from '../../../components/ExampleCard'

import { useFrame, createPortal } from '@react-three/fiber'
import * as THREE from 'three'

import { useRef, useMemo } from 'react'
//* Fbo Demo ==============================

function SpinningThing() {
  const mesh = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (!mesh.current) return
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01
  })

  return (
    <mesh ref={mesh}>
      <torusKnotGeometry args={[1, 0.4, 100, 64]} />
      <meshNormalMaterial />
    </mesh>
  )
}

function TargetWrapper({ target }: { target: THREE.RenderTarget }) {
  const cam = useRef<THREE.PerspectiveCamera>(null!)

  const scene = useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('orange')
    return scene
  }, [])

  useFrame(({ renderer, elapsed }) => {
    cam.current.position.z = 5 + Math.sin(elapsed * 1.5) * 2
    renderer.setRenderTarget(target)
    renderer.render(scene, cam.current)
    renderer.setRenderTarget(null)
  })

  return (
    <>
      <PerspectiveCamera ref={cam} position={[0, 0, 3]} />
      {createPortal(<SpinningThing />, scene)}
      <mesh>
        <boxGeometry args={[3, 3, 3]} />
        <meshStandardMaterial map={target?.texture} />
      </mesh>
    </>
  )
}

function Scene() {
  const fbo = useFBO(256, 256)

  return (
    <>
      <OrbitControls makeDefault />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <TargetWrapper target={fbo} />

      <gridHelper args={[10, 10, '#444', '#333']} position={[0, -2, 0]} />
    </>
  )
}

export default function FboDemo() {
  return (
    <div className="demo-container">
      <ExampleCard demoName="Fbo" />

      <div className="demo-canvas">
        <CanvasWithToggle camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </CanvasWithToggle>
      </div>
    </div>
  )
}
