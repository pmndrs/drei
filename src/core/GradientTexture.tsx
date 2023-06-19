import * as React from 'react'
import { useThree } from '@react-three/fiber'
export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
}

type Props = {
  stops: Array<number>
  colors: Array<string>
  attach?: string
  size?: number
  width?: number
  type?: GradientType
  innerCircleRadius?: number
  outerCircleRadius?: string | number
} & JSX.IntrinsicElements['texture']

export function GradientTexture({
  stops,
  colors,
  size = 1024,
  width = 16,
  //@ts-ignore - weird error about type never, although the type is clearly defined
  type = GradientType.Linear,
  innerCircleRadius = 0,
  outerCircleRadius = 'auto',
  ...props
}: Props) {
  const gl = useThree((state: any) => state.gl)
  const canvas: HTMLCanvasElement = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = size
    let gradient
    if (type === GradientType.Linear) {
      gradient = context.createLinearGradient(0, 0, 0, size)
    } else {
      const canvasCenterX = canvas.width / 2
      const canvasCenterY = canvas.height / 2
      const radius =
        outerCircleRadius !== 'auto'
          ? Math.abs(Number(outerCircleRadius))
          : Math.sqrt(canvasCenterX ** 2 + canvasCenterY ** 2)
      gradient = context.createRadialGradient(
        canvasCenterX,
        canvasCenterY,
        Math.abs(innerCircleRadius),
        canvasCenterX,
        canvasCenterY,
        radius
      )
    }

    let i = stops.length
    while (i--) {
      gradient.addColorStop(stops[i], colors[i])
    }
    context.save()
    context.fillStyle = gradient
    context.fillRect(0, 0, width, size)
    context.restore()

    return canvas
  }, [stops])

  // @ts-ignore ????
  return <canvasTexture colorSpace={gl.outputColorSpace} args={[canvas]} attach="map" {...props} />
}
