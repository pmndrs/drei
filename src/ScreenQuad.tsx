// reference: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
// and @gsimone ;)
import * as THREE from 'three'
import { forwardRef, useMemo } from 'react'

function createScreenQuadGeometry() {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 2))
  return geometry
}

export const ScreenQuad = forwardRef(function ScreenQuad({ children }, ref) {
  const geometry = useMemo(createScreenQuadGeometry, [])

  return (
    <mesh ref={ref} geometry={geometry} frustumCulled={false}>
      {children}
    </mesh>
  )
})
