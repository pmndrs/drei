import { useThree, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface FPVCameraProps {
  /** How sensitive the yaw rotation is (radians per pixel). */
  rotationSpeed?: number
  /** Camera height above the origin (approximate human head height). */
  height?: number
  /** Movement speed in world units per second. */
  moveSpeed?: number
}

export default function FPVCamera({ rotationSpeed = 0.002, height = 1.7, moveSpeed = 2 }: FPVCameraProps) {
  const { camera, gl } = useThree()

  // Drag state for look (yaw)
  const [dragging, setDragging] = useState(false)
  const prevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Keyboard state
  const keys = useRef<Record<string, boolean>>({})

  // Pointer listeners
  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return
      setDragging(true)
      prevPosRef.current = { x: e.clientX, y: e.clientY }
      gl.domElement.style.cursor = 'grabbing'
    },
    [gl.domElement]
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - prevPosRef.current.x
      prevPosRef.current.x = e.clientX

      // Yaw only
      const yawAngle = -dx * rotationSpeed
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawAngle)
      camera.quaternion.premultiply(yawQuat)
      camera.up.set(0, 1, 0)
    },
    [camera, dragging, rotationSpeed]
  )

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.button !== 0) return
      setDragging(false)
      gl.domElement.style.cursor = 'auto'
    },
    [gl.domElement]
  )

  useEffect(() => {
    const dom = gl.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('contextmenu', (e) => e.preventDefault())
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('contextmenu', (e) => e.preventDefault())
    }
  }, [gl.domElement, onPointerDown, onPointerMove, onPointerUp])

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Set initial position and look at center
  useEffect(() => {
    camera.position.set(0, height, 5)
    camera.lookAt(0, height, 0)
  }, [camera, height])

  // Movement and frame update
  useFrame((_, delta) => {
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    dir.y = 0
    dir.normalize()

    const strafe = new THREE.Vector3()
    strafe.copy(dir).cross(camera.up).normalize()

    const velocity = moveSpeed * delta

    if (keys.current['w']) camera.position.addScaledVector(dir, velocity)
    if (keys.current['s']) camera.position.addScaledVector(dir, -velocity)
    if (keys.current['a']) camera.position.addScaledVector(strafe, -velocity)
    if (keys.current['d']) camera.position.addScaledVector(strafe, velocity)
    // Optionally: vertical movement
    if (keys.current[' ']) camera.position.y += velocity
    if (keys.current['shift']) camera.position.y -= velocity
  })

  return null
}
