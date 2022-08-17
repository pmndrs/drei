import * as React from 'react'
import { SVGLoader } from 'three-stdlib'
import { Box3, Sphere, Vector3 } from 'three'
import { useLoader, Canvas } from '@react-three/fiber'

import { MapControls } from '../../src'

export default {
  title: 'Controls/MapControls',
  component: MapControlsScene,
}

const Cell = ({ color, shape, fillOpacity }) => (
  <mesh>
    <meshBasicMaterial color={color} opacity={fillOpacity} depthWrite={false} transparent />
    <shapeGeometry args={[shape]} />
  </mesh>
)

function Svg() {
  const [center, setCenter] = React.useState(() => new Vector3(0, 0, 0))
  const ref = React.useRef<THREE.Group>(null!)

  const { paths } = useLoader(SVGLoader, 'map.svg')

  const shapes = React.useMemo(
    () =>
      paths.flatMap((p) =>
        p.toShapes(true).map((shape) =>
          //@ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21059
          ({ shape, color: p.color, fillOpacity: p.userData.style.fillOpacity })
        )
      ),
    [paths]
  )

  React.useEffect(() => {
    const box = new Box3().setFromObject(ref.current)
    const sphere = new Sphere()
    box.getBoundingSphere(sphere)
    setCenter((vec) => vec.set(-sphere.center.x, -sphere.center.y, 0))
  }, [])

  return (
    <group position={center} ref={ref}>
      {shapes.map((props) => (
        //@ts-expect-error this issue has been raised https://github.com/mrdoob/three.js/pull/21058
        <Cell key={props.shape.uuid} {...props} />
      ))}
    </group>
  )
}

function MapControlsScene() {
  return (
    <Canvas orthographic camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }}>
      <color attach="background" args={[243, 243, 243]} />
      <React.Suspense fallback={null}>
        <Svg />
      </React.Suspense>
      <MapControls />
    </Canvas>
  )
}

export const MapControlsSceneSt = () => <MapControlsScene />
MapControlsSceneSt.story = {
  name: 'Default',
}
