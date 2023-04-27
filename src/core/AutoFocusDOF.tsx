import * as THREE from 'three'
import * as React from 'react'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DepthOfField } from '@react-three/postprocessing'
import { DepthOfFieldEffect } from 'postprocessing'

export type AutoFocusDOFProps = {
  bokehScale?: number
  focalLength?: number
  focusSpeed?: number
  mouseFocus?: boolean
  resolution?: number
}

export function AutoFocusDOF({
  bokehScale = 10,
  focalLength = 0.001,
  focusSpeed = 0.05,
  mouseFocus = false,
  resolution = 512,
}: AutoFocusDOFProps) {
  const { camera, mouse, scene } = useThree()

  const ref = useRef<DepthOfFieldEffect>()
  const raycaster = new THREE.Raycaster()
  const finalVector = new THREE.Vector3()

  raycaster.firstHitOnly = true

  useFrame(() => {
    if (mouseFocus) {
      raycaster.setFromCamera(mouse, camera)
    } else {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    }

    const intersects = raycaster.intersectObjects(scene.children)

    if (intersects.length > 0) {
      console.log('intersects', intersects[0].point)
      finalVector.lerp(intersects[0].point, focusSpeed)
      if (ref.current) {
        ref.current.target = finalVector
      }
    }
  })

  return <DepthOfField focalLength={focalLength} bokehScale={bokehScale} height={resolution} ref={ref} />
}
