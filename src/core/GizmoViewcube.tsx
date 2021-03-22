import * as React from 'react'
import { useGizmoContext } from './GizmoHelper'
import { CanvasTexture, Event, Vector3 } from 'three'

type XYZ = [number, number, number]

const faces = ['right', 'left', 'top', 'bottom', 'front', 'back']

const makePositionVector = (xyz: number[]) => new Vector3(...xyz).multiplyScalar(0.38)

const corners: Vector3[] = [
  [1, 1, 1],
  [1, 1, -1],
  [1, -1, 1],
  [1, -1, -1],
  [-1, 1, 1],
  [-1, 1, -1],
  [-1, -1, 1],
  [-1, -1, -1],
].map(makePositionVector)

const cornerDimensions: XYZ = [0.25, 0.25, 0.25]

const edges: Vector3[] = [
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
].map(makePositionVector)

const edgeDimensions = edges.map(
  (edge) => edge.toArray().map((axis: number): number => (axis == 0 ? 0.5 : 0.25)) as XYZ
)

type FaceTypeProps = {
  hover: boolean
  index: number
}

const FaceMaterial = ({ hover, index }: FaceTypeProps) => {
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
    context.fillText(faces[index].toUpperCase(), 64, 76)
    return new CanvasTexture(canvas)
  }, [index])
  return <meshLambertMaterial map={texture} attachArray="material" color={hover ? 'hotpink' : 'white'} />
}

const FaceCube = () => {
  const { tweenCamera, raycast } = useGizmoContext()
  const [hover, setHover] = React.useState<number | null>(null)
  const handlePointerOut = (e: Event) => {
    setHover(null)
    e.stopPropagation()
  }
  const handlePointerDown = (e: Event) => {
    tweenCamera(e.face.normal)
    e.stopPropagation()
  }
  const handlePointerMove = (e: Event) => {
    setHover(Math.floor(e.faceIndex / 2))
    e.stopPropagation()
  }
  return (
    <mesh
      raycast={raycast}
      onPointerOut={handlePointerOut}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {[...Array(6)].map((_, index) => (
        <FaceMaterial key={index} index={index} hover={hover === index} />
      ))}
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
    </mesh>
  )
}

type EdgeCubeProps = {
  dimensions: XYZ
  position: Vector3
}

const EdgeCube = ({ dimensions, position }: EdgeCubeProps): JSX.Element => {
  const { tweenCamera, raycast } = useGizmoContext()
  const [hover, setHover] = React.useState<boolean>(false)
  const handlePointerOut = (e: Event) => {
    setHover(false)
    e.stopPropagation()
  }
  const handlePointerOver = (e: Event) => {
    setHover(true)
    e.stopPropagation()
  }
  const handlePointerDown = (e: Event) => {
    tweenCamera(position)
    e.stopPropagation()
  }
  return (
    <mesh
      position={position}
      raycast={raycast}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
    >
      <meshBasicMaterial color={hover ? 'hotpink' : 'white'} transparent={true} opacity={0.75} visible={hover} />
      <boxBufferGeometry attach="geometry" args={dimensions} />
    </mesh>
  )
}

export const GizmoViewcube = () => {
  return (
    <group scale={[60, 60, 60]}>
      <FaceCube />
      {edges.map((edge, index) => (
        <EdgeCube key={index} position={edge} dimensions={edgeDimensions[index]} />
      ))}
      {corners.map((corner, index) => (
        <EdgeCube key={index} position={corner} dimensions={cornerDimensions} />
      ))}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  )
}
