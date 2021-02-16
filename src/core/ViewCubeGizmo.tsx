import * as React from 'react'
import { CanvasTexture, Event, Vector3 } from 'three'
import { useGizmoHelper } from './GizmoHelper'

const faces = ['RIGHT', 'LEFT', 'TOP', 'BOTTOM', 'FRONT', 'BACK']

const edges: Array<[number, number, number]> = [
  [1, 1, 0],
  [1, 0, 1],
  [1, 0, -1],
  [1, -1, 0],
  [0, 1, 1],
  [0, 1, -1],
  [0, -1, 1],
  [0, -1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [-1, 0, -1],
  [-1, -1, 0],
]

const corners: Array<[number, number, number]> = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
]

const FaceMaterial = ({ hover, index }: { hover: boolean; index: number }) => {
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128

    const context = canvas.getContext('2d')!
    context.fillStyle = '#eee'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#444'
    context.strokeRect(0, 0, canvas.width, canvas.height)

    context.font = '28px Arial'
    context.textAlign = 'center'
    context.fillStyle = '#222'
    context.fillText(faces[index], 64, 76)
    return new CanvasTexture(canvas)
  }, [index])
  return <meshLambertMaterial map={texture} attachArray="material" color={hover ? 'hotpink' : 'white'} />
}

const FaceCube = () => {
  const { tweenCamera, raycast } = useGizmoHelper()
  const [hover, set] = React.useState<number | null>(null)
  return (
    <mesh
      raycast={raycast}
      onPointerOut={() => set(null)}
      onPointerMove={(e: Event) => set(Math.floor(e.faceIndex / 2))}
      onPointerDown={(e: Event) => void (tweenCamera(e.face.normal), e.stopPropagation())}
    >
      {[...Array(6)].map((_, index) => (
        <FaceMaterial key={index} index={index} hover={hover === index} />
      ))}
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
    </mesh>
  )
}

const EdgeCube = ({ direction }: { direction: [number, number, number] }): JSX.Element => {
  const [x, y, z] = direction
  const dimensions: [number, number, number] = [x == 0 ? 1 / 2 : 1 / 4, y == 0 ? 1 / 2 : 1 / 4, z == 0 ? 1 / 2 : 1 / 4]
  const { tweenCamera, raycast } = useGizmoHelper()
  const [hover, set] = React.useState<boolean>(false)
  const position = new Vector3().set(...direction).setLength(1 - 1 / 2 + 0.1)
  return (
    <mesh
      position={position}
      raycast={raycast}
      onPointerOut={(e: Event) => void (set(false), e.stopPropagation())}
      onPointerOver={(e: Event) => void (set(true), e.stopPropagation())}
      onPointerDown={(e: Event) => void (tweenCamera(position), e.stopPropagation())}
    >
      <meshBasicMaterial color={hover ? 'hotpink' : 'white'} transparent={true} opacity={0.5} visible={hover} />
      <boxBufferGeometry attach="geometry" args={dimensions} />
    </mesh>
  )
}

const CornerCube = ({ direction }: { direction: [number, number, number] }) => {
  const size = 1 / 4
  const { tweenCamera, raycast } = useGizmoHelper()
  const [hover, set] = React.useState<boolean>(false)
  const position = new Vector3().set(...direction).setLength(1 - 2 * size + 0.2)
  return (
    <mesh
      position={position}
      raycast={raycast}
      onPointerOut={(e: Event) => void (set(false), e.stopPropagation())}
      onPointerOver={(e: Event) => void (set(true), e.stopPropagation())}
      onPointerDown={(e: Event) => void (tweenCamera(position), e.stopPropagation())}
    >
      <meshBasicMaterial color={hover ? 'hotpink' : 'white'} transparent={true} opacity={0.5} visible={hover} />
      <boxBufferGeometry attach="geometry" args={[size, size, size]} />
    </mesh>
  )
}

export const ViewCubeGizmo = () => {
  return (
    <group scale={[60, 60, 60]}>
      {corners.map((corner) => (
        <CornerCube direction={corner} />
      ))}
      {edges.map((edge) => (
        <EdgeCube direction={edge} />
      ))}
      <FaceCube />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  )
}
