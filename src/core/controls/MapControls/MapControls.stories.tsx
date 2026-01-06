import * as React from 'react'
import { SVGLoader } from 'three-stdlib'
import { Box3, Sphere, Vector3 } from 'three'
import { useLoader } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react-vite'

import { MapControls } from 'drei'

import { Setup } from '@storybook-setup'

export default {
  title: 'Controls/MapControls',
  component: MapControls,
  decorators: [
    (Story) => (
      <Setup orthographic camera={{ position: [0, 0, 50], zoom: 10, up: [0, 0, 1], far: 10000 }} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MapControls>

type Story = StoryObj<typeof MapControls>

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
        p.toShapes(true).map((shape) => ({ shape, color: p.color, fillOpacity: p.userData.style.fillOpacity }))
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
        <Cell key={props.shape.uuid} {...props} />
      ))}
    </group>
  )
}

function MapControlsScene(props: React.ComponentProps<typeof MapControls>) {
  return (
    <>
      <color attach="background" args={[243, 243, 243]} />

      <React.Suspense fallback={null}>
        <Svg />
      </React.Suspense>

      <MapControls {...props} />
    </>
  )
}

export const MapControlsSt = {
  render: (args) => <MapControlsScene {...args} />,
  name: 'Default',
} satisfies Story
