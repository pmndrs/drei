// reference: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
// and @gsimone ;)
import * as THREE from 'three'
import * as React from 'react'

function createScreenQuadGeometry() {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 2))
  return geometry
}

type Props = Omit<JSX.IntrinsicElements['mesh'], 'args'>

export const ScreenQuad = React.forwardRef<THREE.Mesh, Props>(function ScreenQuad({ children, ...restProps }, ref) {
  const geometry = React.useMemo(createScreenQuadGeometry, [])

  return (
    <mesh ref={ref} geometry={geometry} frustumCulled={false} {...restProps}>
      {children}
    </mesh>
  )
})
