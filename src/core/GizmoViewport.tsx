import * as React from 'react'
import { CanvasTexture, Event } from 'three'
import { useGizmoContext } from './GizmoHelper'

type AxisProps = {
  color: string
  rotation: [number, number, number]
}

function Axis({ color, rotation }: AxisProps) {
  return (
    <group rotation={rotation}>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={[0.8, 0.05, 0.05]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

type AxisHeadProps = JSX.IntrinsicElements['sprite'] & {
  arcStyle: string
  label?: string
  labelColor: string
}

function AxisHead({ arcStyle, label, labelColor, ...props }: AxisHeadProps) {
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')!
    context.beginPath()
    context.arc(32, 32, 16, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = arcStyle
    context.fill()

    if (label) {
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.fillStyle = labelColor
      context.fillText(label, 32, 41)
    }
    return new CanvasTexture(canvas)
  }, [arcStyle, label, labelColor])

  const [active, setActive] = React.useState(false)
  const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1)
  const handlePointerOver = (e: Event) => {
    setActive(true)
    e.stopPropagation()
  }
  const handlePointerOut = (e: Event) => {
    setActive(false)
    e.stopPropagation()
  }
  return (
    <sprite scale={[scale, scale, scale]} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} {...props}>
      <spriteMaterial map={texture} alphaTest={0.3} opacity={label ? 1 : 0.75} toneMapped={false} />
    </sprite>
  )
}

type GizmoViewportProps = JSX.IntrinsicElements['group'] & {
  axisColors?: [string, string, string]
  labelColor?: string
}

export const GizmoViewport = ({
  axisColors = ['#ff3653', '#8adb00', '#2c8fff'],
  labelColor = '#000',
  ...props
}: GizmoViewportProps) => {
  const [colorX, colorY, colorZ] = axisColors
  const { tweenCamera, raycast } = useGizmoContext()
  const axisHeadProps = {
    labelColor,
    onPointerDown: (e: Event) => {
      tweenCamera(e.object.position)
      e.stopPropagation()
    },
    raycast,
  }
  return (
    <group scale={[40, 40, 40]} {...props}>
      <Axis color={colorX} rotation={[0, 0, 0]} />
      <Axis color={colorY} rotation={[0, 0, Math.PI / 2]} />
      <Axis color={colorZ} rotation={[0, -Math.PI / 2, 0]} />
      <AxisHead arcStyle={colorX} position={[1, 0, 0]} label="X" {...axisHeadProps} />
      <AxisHead arcStyle={colorY} position={[0, 1, 0]} label="Y" {...axisHeadProps} />
      <AxisHead arcStyle={colorZ} position={[0, 0, 1]} label="Z" {...axisHeadProps} />
      <AxisHead arcStyle={colorX} position={[-1, 0, 0]} {...axisHeadProps} />
      <AxisHead arcStyle={colorY} position={[0, -1, 0]} {...axisHeadProps} />
      <AxisHead arcStyle={colorZ} position={[0, 0, -1]} {...axisHeadProps} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  )
}
