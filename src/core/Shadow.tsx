import * as React from 'react'
import { Mesh, Color, DoubleSide } from 'three'

type Props = JSX.IntrinsicElements['mesh'] & {
  colorStop?: number
  fog?: boolean
  color?: Color | number | string
  opacity?: number
  depthWrite?: boolean
}

export const Shadow = React.forwardRef(
  (
    { fog = false, renderOrder, depthWrite = false, colorStop = 0.0, color = 'black', opacity = 0.5, ...props }: Props,
    ref
  ) => {
    const canvas = React.useMemo(() => {
      const canvas = document.createElement('canvas')
      canvas.width = 128
      canvas.height = 128
      const context = canvas.getContext('2d') as CanvasRenderingContext2D
      const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      )
      gradient.addColorStop(colorStop, new Color(color).getStyle())
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, canvas.width, canvas.height)
      return canvas
    }, [color, colorStop])
    return (
      <mesh renderOrder={renderOrder} ref={ref as React.MutableRefObject<Mesh>} rotation-x={-Math.PI / 2} {...props}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={opacity} fog={fog} depthWrite={depthWrite} side={DoubleSide}>
          <canvasTexture attach="map" args={[canvas]} />
        </meshBasicMaterial>
      </mesh>
    )
  }
)
