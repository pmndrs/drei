import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { Environment } from './Environment'
import { ContactShadows } from './ContactShadows'

type Props = JSX.IntrinsicElements['group'] & {
  contactShadow?: boolean
  shadows?: boolean
  adjustCamera?: boolean
  environment?: string
  intensity?: number
}

export function Stage({ children, contactShadow, shadows, adjustCamera, environment, intensity = 1, ...props }: Props) {
  const camera = useThree((state) => state.camera)
  const outer = React.useRef<THREE.Group>(null!)
  const inner = React.useRef<THREE.Group>(null!)
  const [radius, setRadius] = React.useState(0)

  React.useLayoutEffect(() => {
    outer.current.position.set(0, 0, 0)
    outer.current.updateWorldMatrix(true, true)
    const box3 = new THREE.Box3().setFromObject(inner.current)
    const center = new THREE.Vector3()
    const sphere = new THREE.Sphere()
    const height = box3.max.y - box3.min.y
    box3.getCenter(center)
    box3.getBoundingSphere(sphere)
    setRadius(sphere.radius)
    outer.current.position.set(-center.x, -center.y + height / 2, -center.z)
  }, [children])

  React.useLayoutEffect(() => {
    if (adjustCamera) {
      camera.position.set(0, radius * 1.5, radius * 2.5)
      camera.near = 1
      camera.far = Math.max(5000, radius * 4)
      camera.lookAt(0, 0, 0)
    }
  }, [radius, adjustCamera])

  return (
    <group {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
      {contactShadow && (
        <ContactShadows
          rotation-x={Math.PI / 2}
          opacity={0.5}
          width={radius * 2}
          height={radius * 2}
          blur={2}
          far={radius / 2}
        />
      )}
      <spotLight position={[radius, radius * 2, radius]} intensity={intensity * 2} castShadow={shadows} />
      <pointLight position={[-radius * 2, -radius * 2, -radius * 2]} intensity={intensity} />
      {environment && <Environment preset={environment} />}
    </group>
  )
}
